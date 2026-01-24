
import { GoogleGenAI, Type } from "@google/genai";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 segundo

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const extractTravelInfo = async (text: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY não encontrada. Verifique as 'Environment Variables' no painel da Vercel e faça um Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    Você é um assistente especializado em extração de dados administrativos de viagens e diárias.
    Sua tarefa é analisar textos complexos e extrair as seguintes informações para CADA viagem mencionada:

    1. DATA E LÓGICA DE HORÁRIOS: ESTA INFORMAÇÃO DEVE SER A PRIMEIRA DA LINHA.
       - SE as datas forem IGUAIS: Use o formato "DD/MM/AAAA, Cidade, saida: HH:mm, retorno: HH:mm".
       - SE as datas forem DIFERENTES: Use o formato "saida: DD/MM/AAAA HH:mm, retorno: DD/MM/AAAA HH:mm, Cidade".
    
    2. CIDADE DESTINO: Identifique para onde o colaborador foi. 

    3. ATIVIDADE / MOTIVO DA DIÁRIA (REGRAS CRÍTICAS): 
       - RETIRE obrigatoriamente a primeira sigla (ex: DETF, GAB, etc) e o hífen.
       - REMOVA obrigatoriamente qualquer conteúdo entre parênteses ().

    REGRAS DE FORMATAÇÃO FINAL:
    - Cada viagem em uma ÚNICA linha.
    - Comece SEMPRE pela Data/Horário.
    - Campos separados por VÍRGULA.
    - Sufixo obrigatório: " - com solicitação de diarias"
  `;

  let lastError: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extracted_lines: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              }
            },
            required: ["extracted_lines"]
          }
        },
      });

      const result = JSON.parse(response.text);
      return result.extracted_lines || [];

    } catch (error: any) {
      lastError = error;
      
      // Verifica se o erro é de sobrecarga (503) ou excesso de requisições (429)
      const isOverloaded = error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("429");
      
      if (isOverloaded && i < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, i); // Backoff exponencial: 1s, 2s, 4s
        console.warn(`Servidor ocupado. Tentativa ${i + 1} de ${MAX_RETRIES}. Tentando novamente em ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      break; // Se não for erro de sobrecarga ou acabarem as tentativas, sai do loop
    }
  }

  console.error("Erro final após tentativas:", lastError);
  if (lastError.message?.includes("503") || lastError.message?.includes("overloaded")) {
    throw new Error("O servidor do Google está muito ocupado no momento. Por favor, aguarde um minuto e tente novamente.");
  }
  throw new Error(lastError.message || "Falha ao processar o texto.");
};
