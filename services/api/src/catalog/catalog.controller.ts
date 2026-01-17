import { Controller, Get, Param, Query } from "@nestjs/common";

@Controller("catalog")
export class CatalogController {
  @Get("categories")
  async categories() {
    return [
      { id: "c1", name: "Sut" },
      { id: "c2", name: "Su" },
      { id: "c3", name: "Atistirmalik" }
    ];
  }

  @Get("products")
  async products(@Query("query") query?: string) {
    const all = [
      { id: "p1", name: "Sut 1L", price: 19.9, stock: "LOW" },
      { id: "p2", name: "Su 1.5L", price: 9.9, stock: "IN" }
    ];
    if (!query) return all;
    return all.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }

  @Get("products/:id")
  async product(@Param("id") id: string) {
    return { id, name: "Sut 1L", price: 19.9, stock: "LOW" };
  }
}
