
import { GoogleGenAI, Type } from "@google/genai";

export const extractTravelInfo = async (text: string): Promise<string[]> => {
  // Use a chave diretamente na inicialização conforme as diretrizes.
  // Assume-se que process.env.API_KEY está configurado no ambiente de execução (ex: Vercel).
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Você é um assistente especializado em extração de dados administrativos de viagens e diárias.
    Sua tarefa é analisar textos complexos e extrair as seguintes informações para CADA viagem mencionada:

    1. CIDADE DESTINO: Identifique para onde o colaborador foi. ESTA INFORMAÇÃO DEVE SER A PRIMEIRA DA LINHA.

    2. LÓGICA DE DATAS E HORÁRIOS:
       - Verifique a data de saída e a data de retorno.
       - SE as datas forem IGUAIS: Use o formato "Cidade, DD/MM/AAAA, saida: HH:mm, retorno: HH:mm".
       - SE as datas forem DIFERENTES: Use o formato "Cidade, saida: DD/MM/AAAA HH:mm, retorno: DD/MM/AAAA HH:mm".
    
    3. ATIVIDADE / MOTIVO DA DIÁRIA (REGRAS CRÍTICAS): 
       - Identifique o campo "Motivo Diária".
       - RETIRE obrigatoriamente a primeira sigla (ex: DETF, GAB, etc) e o hífen que a segue.
       - REMOVA obrigatoriamente qualquer conteúdo que esteja dentro de parênteses ().
       - Mantenha o restante da descrição de forma clara e resumida.
       - Exemplo: "DETF - Fiscalização/vistoria em credenciados (CFC, ECV)" deve virar "Fiscalização/vistoria em credenciados".

    REGRAS DE FORMATAÇÃO FINAL:
    - Cada viagem deve ocupar uma ÚNICA linha.
    - Comece SEMPRE pela Cidade.
    - Todos os campos devem ser separados por VÍRGULA.
    - Ao final de cada linha, acrescente obrigatoriamente o sufixo: " - com solicitação de diarias"
    - Retorne as linhas em um array JSON chamado "extracted_lines".

    Exemplos de saída:
    Mesmo dia: "Sorocaba, 20/05/2024, saida: 07:00, retorno: 19:00, Fiscalização - com solicitação de diarias"
    Dias diferentes: "Campinas, saida: 20/05/2024 07:00, retorno: 22/05/2024 18:00, Reunião técnica - com solicitação de diarias"
  `;

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
              description: "Linhas formatadas iniciando pela Cidade, com lógica condicional de data e limpeza de sigla/parênteses."
            }
          },
          required: ["extracted_lines"]
        }
      },
    });

    const result = JSON.parse(response.text);
    return result.extracted_lines || [];
  } catch (error: any) {
    console.error("Erro na extração:", error);
    // Caso o erro seja especificamente sobre a chave na resposta da API
    if (error.message?.includes("API key")) {
        throw new Error("Erro de Autenticação: A Chave de API configurada no ambiente é inválida ou expirou.");
    }
    throw new Error("Falha ao processar o texto. Verifique sua conexão e se o conteúdo é válido.");
  }
};
