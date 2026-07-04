# Object storage (Active Storage)

Profile pictures and other uploads are handled by **Active Storage**. Only
metadata lives in Postgres (`active_storage_blobs`, `active_storage_attachments`,
`active_storage_variant_records` — migration `025`); the actual bytes live in an
**S3-compatible object store**. The S3 service (`config/storage.yml`) is fully
env-driven, so the same code targets MinIO in dev and Tigris/S3 in prod.

## Environment variables

| Var                     | Dev (MinIO)                              | Prod (Tigris / S3)                     |
|-------------------------|------------------------------------------|----------------------------------------|
| `S3_ENDPOINT`           | `http://minio:9000`                      | from `fly storage create` (Tigris)     |
| `S3_REGION`             | `us-east-1`                              | `auto` (Tigris) / your AWS region      |
| `S3_BUCKET`             | `matcha-uploads`                         | provisioned bucket name                |
| `S3_ACCESS_KEY_ID`      | `minioadmin`                             | secret                                 |
| `S3_SECRET_ACCESS_KEY`  | `minioadmin`                             | secret                                 |
| `S3_FORCE_PATH_STYLE`   | `true`                                   | `true`                                 |
| `S3_PUBLIC_URL`         | `http://localhost:9000/matcha-uploads`   | public bucket/CDN URL                  |

## Local development

`docker compose up` starts a **MinIO** container with a persistent `miniodata`
volume plus a one-shot `createbuckets` job that creates `matcha-uploads` and
makes it publicly readable. Console: <http://localhost:9001> (minioadmin /
minioadmin). No extra steps.

## Production on Fly.io

> The app (`matcha42`) and Postgres are separate Fly instances. **Object storage
> must also be independent of the app machine** — app machines auto-stop and can
> scale to several, so a disk/volume on the app VM is neither durable nor shared.

### Recommended: Tigris (Fly's native S3)

No container or volume to run. Tigris speaks S3, so nothing in the app changes —
only env values.

```bash
# Provisions a Tigris bucket and injects credentials as app secrets.
fly storage create

# Point Active Storage's S3 service at Tigris (names may already be set by the
# command above — reconcile with `fly secrets list`):
fly secrets set \
  S3_ENDPOINT="$AWS_ENDPOINT_URL_S3" \
  S3_BUCKET="$BUCKET_NAME" \
  S3_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  S3_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  S3_REGION="auto" \
  S3_FORCE_PATH_STYLE="true"
```

### Alternative: self-hosted MinIO as its own Fly app

Run MinIO as a **separate** Fly app with a Fly Volume; reach it from `matcha42`
over private networking at `matcha-minio.internal:9000` (never co-located on the
api machine). Scaffold:

```toml
# deploy/minio/fly.toml
app = "matcha-minio"
primary_region = "cdg"

[build]
  image = "minio/minio"

[experimental]
  cmd = ["server", "/data", "--console-address", ":9001"]

[[mounts]]
  source = "miniodata"
  destination = "/data"

[[services]]
  internal_port = 9000
  protocol = "tcp"
  # keep it on the private network only; do not expose 9000 publicly
```

```bash
fly apps create matcha-minio
fly volumes create miniodata --app matcha-minio --region cdg --size 10
fly secrets set --app matcha-minio \
  MINIO_ROOT_USER=... MINIO_ROOT_PASSWORD=...
fly deploy --app matcha-minio --config deploy/minio/fly.toml

# Then, on the api app:
fly secrets set \
  S3_ENDPOINT="http://matcha-minio.internal:9000" \
  S3_BUCKET="matcha-uploads" \
  S3_ACCESS_KEY_ID="..." S3_SECRET_ACCESS_KEY="..." \
  S3_FORCE_PATH_STYLE="true"
```

> Note: this is a **Sinatra + ActiveRecord** app (not Rails); Active Storage is
> used standalone. Kamal is **not** used here — deployment is Fly.io.
