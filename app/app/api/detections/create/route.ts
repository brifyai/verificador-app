import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Endpoint para crear detecciones desde el VPS
 * Solo crea detecciones que necesitan verificación humana
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const {
      userId,
      phraseText,
      brand,
      campaign,
      detectedText,
      confidence,
      verifiedBy,
      reason,
      folderName,
      radioName,
      timestamp,
      needsVerification
    } = body;

    // Validaciones
    if (!userId || !phraseText || !detectedText) {
      return NextResponse.json(
        { error: "userId, phraseText y detectedText son requeridos" },
        { status: 400 }
      );
    }

    // Solo crear si necesita verificación
    if (!needsVerification) {
      return NextResponse.json(
        { message: "Detección con alta confianza, no requiere verificación" },
        { status: 200 }
      );
    }

    // Buscar o crear la frase
    let phrase = await prisma.phrase.findFirst({
      where: {
        text: phraseText,
        userId: userId
      }
    });

    if (!phrase) {
      phrase = await prisma.phrase.create({
        data: {
          text: phraseText,
          brand: brand || "No especificada",
          campaign: campaign || "No especificada",
          category: "PROMOTION",
          userId: userId
        }
      });
    }

    // Buscar o crear la radio
    let radio = await prisma.radio.findFirst({
      where: {
        name: radioName
      }
    });

    if (!radio) {
      radio = await prisma.radio.create({
        data: {
          name: radioName,
          streamUrl: "",
          region: "No especificada",
          userId: userId
        }
      });
    }

    // Crear la detección
    const detection = await prisma.detection.create({
      data: {
        phraseId: phrase.id,
        radioId: radio.id,
        timestamp: new Date(timestamp),
        confidence: confidence,
        verified: false, // No verificada aún
        falsePositive: false,
        metadata: {
          detectedText: detectedText,
          verifiedBy: verifiedBy,
          reason: reason,
          folderName: folderName,
          needsVerification: true
        }
      }
    });

    console.log(`✅ Detección creada para verificación: ${detection.id}`);

    return NextResponse.json({
      success: true,
      detectionId: detection.id
    });

  } catch (error) {
    console.error("❌ Error creando detección:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
