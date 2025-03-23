import {z} from 'zod';
const UUID = z.string().uuid();
const DateTimeString = z.date() 

export const ProductSchema = z.object({
    id: UUID,
    name: z.string(),
    competitorName: z.string(),
    url: z.string(),
    currentPrice: z.number(),
    newPrice: z.number(),   
});

export type Product = z.infer<typeof ProductSchema>;