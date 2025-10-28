"use client"

import { use } from "react"
import { AddLiquidityForm } from "@/components/add-liquidity-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AddLiquidityPageProps {
  params: Promise<{ id: string }>
}

export default function AddLiquidityPage({ params }: AddLiquidityPageProps) {
  const { id } = use(params)

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Back Button */}
        <Link href={`/pools/${id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pool
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Add Liquidity
          </h1>
          <p className="text-muted-foreground text-lg">Provide liquidity and earn trading fees</p>
        </div>

        {/* Add Liquidity Form */}
        <AddLiquidityForm poolId={id} />
      </div>
    </div>
  )
}
