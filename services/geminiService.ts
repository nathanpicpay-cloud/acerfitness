import { GoogleGenAI } from "@google/genai";
import { UserProfile, WeeklyWorkoutPlan, DietPlan, Exercise } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

// Helper to clean JSON strings from markdown code blocks
const cleanText = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateWeeklyWorkout = async (profile: UserProfile): Promise<WeeklyWorkoutPlan | null> => {
  if (!apiKey) {
    console.error("API Key not found. Please set API_KEY in environment.");
    return null;
  }

  const prompt = `
    Atue como um treinador de elite do Acer Fitness PRO.
    Crie uma divisão de treino completa (Split) baseada nestes dados:
    Peso: ${profile.weight}kg, Nível: ${profile.level}, Local: ${profile.location}, Objetivo: ${profile.goal}.

    Se for iniciante, faça treino Full Body ou AB. Se avançado, ABC ou ABCD.
    
    Retorne JSON ESTRITO seguindo este schema exato, SEM texto antes ou depois:
    {
      "title": "Nome do Programa (ex: Protocolo Hipertrofia Avançada)",
      "overview": "Breve resumo da metodologia",
      "split": [
        {
          "dayName": "Ex: Treino A - Peito e Tríceps",
          "focus": "Ex: Força e Hipertrofia",
          "duration": "Ex: 60 min",
          "exercises": [
            {
              "id": "unique_id_1",
              "name": "Nome do exercício",
              "muscleGroup": "Músculo alvo",
              "sets": 4 (número),
              "reps": "10-12",
              "restSeconds": 60 (número),
              "instructions": "Como fazer",
              "tips": "Dica pro"
            }
          ]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const cleanJson = cleanText(response.text || "{}");
    const result = JSON.parse(cleanJson);
    
    // Defensive coding
    return {
      title: result.title || "Protocolo Personalizado Acer",
      overview: result.overview || "Foco total nos resultados.",
      split: Array.isArray(result.split) ? result.split : []
    };
  } catch (error) {
    console.error("Error generating workout:", error);
    return null;
  }
};

export const swapExercise = async (currentExercise: Exercise, userGoal: string): Promise<Exercise | null> => {
  if (!apiKey) return null;

  const prompt = `
    O usuário precisa substituir o exercício "${currentExercise.name}" (Grupo: ${currentExercise.muscleGroup}).
    Objetivo do usuário: ${userGoal}.
    Motivo: Máquina ocupada ou desconforto.
    
    Sugira UM exercício equivalente biomecanicamente.
    Retorne APENAS o JSON do novo exercício:
    {
      "id": "new_id_${Date.now()}",
      "name": "Novo Nome",
      "muscleGroup": "${currentExercise.muscleGroup}",
      "sets": ${currentExercise.sets},
      "reps": "${currentExercise.reps}",
      "restSeconds": ${currentExercise.restSeconds},
      "instructions": "Breve instrução",
      "tips": "Dica rápida"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const cleanJson = cleanText(response.text || "{}");
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error swapping exercise:", error);
    return null;
  }
};

export const generateDiet = async (profile: UserProfile, budget: number, period: 'Diário' | 'Semanal' | 'Mensal'): Promise<DietPlan | null> => {
  if (!apiKey) return null;

  const prompt = `
    Crie um plano alimentar econômico para um orçamento de R$ ${budget} (${period}).
    Perfil: ${profile.weight}kg, Objetivo: ${profile.goal}.
    
    Foque em alimentos baratos disponíveis no Brasil.
    Retorne um JSON estrito com:
    - totalCost (Custo estimado numérico)
    - period (String igual ao input)
    - meals (Array: name, costEstimate, calories, protein, carbs, fats, ingredients (array string), preparation)
    - shoppingList (Array string)
    - savingsTips (Array string: dicas de economia e substituição)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const cleanJson = cleanText(response.text || "{}");
    const result = JSON.parse(cleanJson);

    return {
      totalCost: result.totalCost || 0,
      period: result.period || period,
      meals: Array.isArray(result.meals) ? result.meals : [],
      shoppingList: Array.isArray(result.shoppingList) ? result.shoppingList : [],
      savingsTips: Array.isArray(result.savingsTips) ? result.savingsTips : []
    };
  } catch (error) {
    console.error("Error generating diet:", error);
    return null;
  }
};

export const generateAffiliateCopy = async (type: 'whatsapp' | 'instagram' | 'email'): Promise<string> => {
  if (!apiKey) return "Erro: API Key não configurada.";

  const prompt = `
    Escreva um texto de marketing (Copy) persuasivo para vender o "Acer Fitness PRO".
    Canal: ${type}.
    
    Pontos chave:
    - IA que monta treinos e dietas pelo orçamento.
    - Design futurista.
    - Resultados rápidos.
    - Use emojis.
    - Inclua um placeholder [SEU LINK] para o link de afiliado.
    
    Apenas retorne o texto cru.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "Erro ao gerar copy. Tente novamente.";
  }
};

export const chatWithTrainer = async (message: string, context: string): Promise<string> => {
  if (!apiKey) return "Erro: Conexão com a IA não configurada (Verifique API_KEY).";

  const prompt = `
    Você é o Personal Trainer IA do Acer Fitness PRO.
    Contexto do usuário: ${context}.
    
    Responda à pergunta do usuário: "${message}"
    
    Diretrizes:
    - Seja motivador mas técnico.
    - Se for sobre dieta, sugira opções baratas.
    - Se for sobre treino, explique a biomecânica de forma simples.
    - Responda em Markdown formatado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (error) {
    return "Erro de conexão com a IA.";
  }
};
