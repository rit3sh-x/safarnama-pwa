import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { Id } from "@backend/dataModel"
import { z } from "zod"

const blogParamsSchema = z.object({
    blogId: z.string().transform((val) => val as Id<"blog">),
})

export const Route = createFileRoute('/(layout)/(custom)/blogs/$blogId')({
    params: {
        parse: (params) => blogParamsSchema.parse(params),
        stringify: (params) => ({
            blogId: `${params.blogId}`,
        }),
    },
    component: Layout,
})

function Layout() {
    return <Outlet />
}
