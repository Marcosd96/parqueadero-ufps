"use server";

import prisma from "@parqueadero/database";
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

export async function assignRfidTag(vehicleId: number, rfidTag: string | null) {
  try {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { rfidTag: rfidTag ? rfidTag.trim().toUpperCase() : null },
    });
    revalidatePath("/vehicles");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[assignRfidTag]", error);
    // Unique constraint violation
    if (error?.code === "P2002") {
      return { error: "Este TAG RFID ya está asignado a otro vehículo." };
    }
    return { error: "No se pudo asignar el TAG RFID." };
  }
}
