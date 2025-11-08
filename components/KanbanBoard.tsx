'use client';

import { useCallback } from 'react';
import { Memory } from '@/lib/types';
import { MasonryMemoryCard } from '@/components/MasonryMemoryCard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
    memories: Memory[];
    onMemoryClick: (memory: Memory) => void;
    onMemoriesChange: (memories: Memory[]) => void;
}

// Sortable Item Wrapper
function SortableMemoryItem({ memory, onClick }: { memory: Memory; onClick: (m: Memory) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: memory.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
            <MasonryMemoryCard
                memory={memory}
                onClick={() => onClick(memory)}
                layout="grid"
            />
        </div>
    );
}

export function KanbanBoard({ memories, onMemoryClick, onMemoriesChange }: KanbanBoardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag, preventing accidental drags on clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = memories.findIndex((m) => m.id === active.id);
            const newIndex = memories.findIndex((m) => m.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onMemoriesChange(arrayMove(memories, oldIndex, newIndex));
            }
        }
    }, [memories, onMemoriesChange]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={memories.map(m => m.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full auto-rows-max pb-20">
                    {memories.map((memory) => (
                        <SortableMemoryItem
                            key={memory.id}
                            memory={memory}
                            onClick={onMemoryClick}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
