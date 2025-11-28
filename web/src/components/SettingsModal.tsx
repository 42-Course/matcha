import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import * as LucideIcons from "lucide-react";
import { X } from "lucide-react";

type CardId = "profile" | "edit" | "discover" | "conversations" | "admin" | "logout";

type CardConfig = {
  id: CardId;
  title: string;
  visible: boolean;
  bg: string;
  icon: string;
};

interface SettingsModalProps {
  cards: CardConfig[];
  order: CardId[];
  mode: string;
  animation: string;
  onClose: () => void;
  onUpdateCards: (id: CardId, patch: Partial<CardConfig>) => void;
  onSetOrder: (order: CardId[]) => void;
  onSetMode: (mode: string) => void;
  onSetAnimation: (animation: string) => void;
  getSafeIcon: (iconName: string | unknown) => React.FC<any>;
  onReset: () => void;
}

export function SettingsModal({
  cards,
  order,
  mode,
  animation,
  onClose,
  onUpdateCards,
  onSetOrder,
  onSetMode,
  onSetAnimation,
  getSafeIcon,
  onReset,
}: SettingsModalProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [iconSearch, setIconSearch] = useState("");
  const ICONS = Object.keys(LucideIcons).filter(
    (k) => typeof (LucideIcons as any)[k] === "function"
  );

  const filteredIcons = ICONS.filter((icon) =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  ).slice(0, 80);

  function handleDragEnd(e: any) {
    const { active, over } = e;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as CardId);
      const newIndex = order.indexOf(over.id as CardId);
      onSetOrder(arrayMove(order, oldIndex, newIndex));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6 overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close settings"
          >
            <X />
          </button>
        </div>

        {/* Display Mode & Animation */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold">Display Mode</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { key: "grid", label: "Grid" },
                { key: "list", label: "List" },
                { key: "compact", label: "Compact" },
                { key: "horizontal", label: "Horizontal" },
                { key: "masonry", label: "Masonry" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onSetMode(key)}
                  className={`px-3 py-1 rounded ${
                    mode === key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Animation</h3>
            <div className="mt-2 flex gap-2">
              {[
                { key: "fade", label: "Fade" },
                { key: "slide", label: "Slide" },
                { key: "scale", label: "Scale" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onSetAnimation(key)}
                  className={`px-3 py-1 rounded ${
                    animation === key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cards Config */}
        <section className="mt-8">
          <h3 className="font-semibold mb-3">Cards (Reorder, Toggle, Customize)</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={order}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 max-h-72 overflow-auto pr-2">
                {order.map((id) => {
                  const card = cards.find((c) => c.id === id)!;
                  const Icon = getSafeIcon(card.icon);

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-2 rounded border bg-gray-50 dark:bg-gray-900"
                    >
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded ${
                          card.bg === "bg-white dark:bg-gray-800"
                            ? "bg-white dark:bg-gray-800"
                            : ""
                        }`}
                        style={
                          typeof card.bg === "string" && card.bg !== "bg-white dark:bg-gray-800"
                            ? { background: card.bg }
                            : undefined
                        }
                      >
                        <Icon size={24} />
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {card.title}
                        </div>
                        <div className="text-xs text-gray-500">ID: {card.id}</div>
                      </div>

                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={card.visible}
                          onChange={(e) =>
                            onUpdateCards(card.id, { visible: e.target.checked })
                          }
                        />
                        Visible
                      </label>

                      <button
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                        onClick={() => {
                          const nextBg = prompt(
                            "Enter a Tailwind background class or CSS color (e.g. 'bg-pink-50 dark:bg-pink-900' or '#ff0000')",
                            card.bg
                          );
                          if (nextBg !== null)
                            onUpdateCards(card.id, {
                              bg: nextBg || "bg-white dark:bg-gray-800",
                            });
                        }}
                      >
                        Color
                      </button>

                      <button
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                        onClick={() => {
                          const iconName = prompt(
                            "Enter a Lucide icon name (e.g. User, Heart, Mail)",
                            card.icon
                          );
                          if (
                            iconName &&
                            typeof (LucideIcons as any)[iconName] === "function"
                          ) {
                            onUpdateCards(card.id, { icon: iconName });
                          } else if (iconName) {
                            alert("Invalid icon name");
                          }
                        }}
                      >
                        Icon
                      </button>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 rounded bg-red-50 text-red-700"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-900 text-white"
            >
              Save & Close
            </button>
          </div>
        </section>

        {/* Icon Picker */}
        <section className="mt-8">
          <h3 className="font-semibold mb-2">Icon Picker (search and pick)</h3>
          <input
            type="text"
            placeholder="Search icons..."
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
          />
          <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-auto p-1">
            {filteredIcons.map((iconName) => {
              const Icon = getSafeIcon(iconName);
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    const targetCard = prompt(
                      "Enter card id to apply this icon (profile, edit, discover, conversations, admin, logout)"
                    );
                    if (targetCard && order.includes(targetCard as CardId)) {
                      onUpdateCards(targetCard as CardId, { icon: iconName });
                      alert(`Icon updated on ${targetCard}`);
                    } else {
                      alert("Invalid card id");
                    }
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Icon size={20} />
                  <div className="text-xs">{iconName}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
