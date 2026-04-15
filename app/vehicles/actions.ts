"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteVehicle(id: number) {
  try {
    await prisma.vehicle.delete({
      where: { id },
    });
    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("[deleteVehicle]", error);
    return { error: "No se pudo eliminar el vehículo." };
  }
}

export async function updateVehicle(id: number, data: {
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  status?: string;
  department?: string;
}) {
  try {
    await prisma.vehicle.update({
      where: { id },
      data,
    });
    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("[updateVehicle]", error);
    return { error: "No se pudo actualizar el vehículo." };
  }
}
