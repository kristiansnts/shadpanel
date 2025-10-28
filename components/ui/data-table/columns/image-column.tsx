"use client"

import Image from "next/image"
import { ImageColumnProps } from "../types"
import { Row } from "@tanstack/react-table"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ImageColumn(_props: ImageColumnProps) {
  // This component doesn't render anything - it's just for configuration
  return null
}

// Column definition generator
ImageColumn.createColumnDef = (props: ImageColumnProps) => {
  const {
    accessor = "",
    header = "",
    hideable = false,
    className = "relative h-10 w-10 overflow-hidden rounded-full",
    alt,
  } = props

  return {
    accessorKey: accessor,
    header: header,
    cell: ({ row, getValue }: { row: Row<unknown>; getValue: () => unknown }) => {
      const imageUrl = getValue() as string
      const altText = alt ? alt(row.original) : "Image"

      return (
        <div className={className}>
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      )
    },
    enableSorting: false,
    enableHiding: hideable,
  }
}
