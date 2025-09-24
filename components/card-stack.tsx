"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StackCard {
  id: string
  title: string
  subtitle: string
  content: string
  color: string
  textColor?: string
}

interface CardStackProps {
  cards: StackCard[]
  className?: string
}

export function CardStack({ cards, className }: CardStackProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    setDraggedCard(cardId)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedCard) {
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y
      setDragOffset({ x: deltaX, y: deltaY })
    }
  }

  const handleMouseUp = () => {
    setDraggedCard(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const getCardStyle = (index: number, cardId: string) => {
    const isBeingDragged = draggedCard === cardId
    const totalCards = cards.length
    const centerIndex = (totalCards - 1) / 2

    // Calculate rotation angle for fan effect
    const rotationAngle = (index - centerIndex) * 8 // 8 degrees per card

    // Calculate horizontal offset for fan spread
    const horizontalOffset = (index - centerIndex) * 15

    // Calculate vertical offset (cards further from center are slightly lower)
    const verticalOffset = Math.abs(index - centerIndex) * 8

    // Scale effect - front cards slightly larger
    const scale = 1 - Math.abs(index - centerIndex) * 0.02

    const baseTransform = `translate(${horizontalOffset}px, ${verticalOffset}px) rotate(${rotationAngle}deg) scale(${scale})`

    if (isBeingDragged) {
      return {
        transform: `${baseTransform} translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
        zIndex: 1000,
        transition: "none",
      }
    }

    return {
      transform: baseTransform,
      zIndex: totalCards - Math.abs(index - centerIndex),
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    }
  }

  return (
    <div
      className={cn("relative w-96 h-96 flex items-center justify-center", className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          className={cn(
            "absolute w-64 h-80 cursor-grab active:cursor-grabbing select-none",
            "shadow-lg hover:shadow-xl transition-shadow duration-300",
            "border-0 rounded-2xl",
          )}
          style={{
            ...getCardStyle(index, card.id),
            backgroundColor: card.color,
            color: card.textColor || "#ffffff",
          }}
          onMouseDown={(e) => handleMouseDown(e, card.id)}
        >
          <div className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-balance">{card.title}</h3>
              <p className="text-sm opacity-90 mb-4">{card.subtitle}</p>
            </div>
            <div className="flex-1 flex items-center">
              <p className="text-sm leading-relaxed opacity-80">{card.content}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="w-8 h-6 bg-white/20 rounded-sm flex items-center justify-center">
                <div className="w-4 h-3 bg-white/40 rounded-xs"></div>
              </div>
              <div className="text-xs font-medium opacity-90">CARD {String(index + 1).padStart(2, "0")}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}