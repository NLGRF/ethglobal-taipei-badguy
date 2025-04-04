"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Counter Example</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-4xl font-bold">{count}</p>
        <p className="text-sm text-muted-foreground mt-2">Click the buttons below to update the counter</p>
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        <Button variant="outline" onClick={() => setCount(count - 1)}>
          Decrement
        </Button>
        <Button variant="default" onClick={() => setCount(count + 1)}>
          Increment
        </Button>
      </CardFooter>
    </Card>
  )
} 