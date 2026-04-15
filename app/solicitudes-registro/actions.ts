"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateRegistrationStatus(id: number, status: string) {
  try {
    await prisma.userRegistration.update({
      where: { id },
      data: { status },
    });
    
    revalidatePath("/solicitudes-registro");
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { error: "No se pudo actualizar el estado." };
  }
}
