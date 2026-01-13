
import { GoogleGenAI, Type } from "@google/genai";

export const extractTravelInfo = async (text: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "") {
    throw new Error("Erro de Configuração: A chave de API não foi encontrada no ambiente de execução. Certifique-se de adicioná-la às variáveis de ambiente (Environment Variables) do seu projeto na Vercel com o nome 'API_KEY'.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    Você é um assistente especializado em extração de dados administrativos de viagens e diárias.
    Sua tarefa é analisar textos complexos e extrair as seguintes informações para CADA viagem mencionada:

    1. DATA E LÓGICA DE HORÁRIOS: ESTA INFORMAÇÃO DEVE SER A PRIMEIRA DA LINHA.
       - Verifique a data de saída e a data de retorno.
       - SE as datas forem IGUAIS: Use o formato "DD/MM/AAAA, Cidade, saida: HH:mm, retorno: HH:mm".
       - SE as datas forem DIFERENTES: Use o formato "saida: DD/MM/AAAA HH:mm, retorno: DD/MM/AAAA HH:mm, Cidade".
    
    2. CIDADE DESTINO: Identifique para onde o colaborador foi. Ela deve vir logo após a data (se data única) ou após os horários (se datas diferentes).

    3. ATIVIDADE / MOTIVO DA DIÁRIA (REGRAS CRÍTICAS): 
       - Identifique o campo "Motivo Diária".
       - RETIRE obrigatoriamente a primeira sigla (ex: DETF, GAB, etc) e o hífen que a segue.
       - REMOVA obrigatoriamente qualquer conteúdo que esteja dentro de parênteses ().
       - Mantenha o restante da descrição de forma clara e resumida.
       - Exemplo: "DETF - Fiscalização/vistoria em credenciados (CFC, ECV)" deve virar "Fiscalização/vistoria em credenciados".

    REGRAS DE FORMATAÇÃO FINAL:
    - Cada viagem deve ocupar uma ÚNICA linha.
    - Comece SEMPRE pela Data ou Bloco de Datas/Horários.
    - Todos os campos principais devem ser separados por VÍRGULA.
    - Ao final de cada linha, acrescente obrigatoriamente o sufixo: " - com solicitação de diarias"
    - Retorne as linhas em um array JSON chamado "extracted_lines".

    Exemplos de saída:
    Mesmo dia: "20/05/2024, Sorocaba, saida: 07:00, retorno: 19:00, Fiscalização - com solicitação de diarias"
    Dias diferentes: "saida: 20/05/2024 07:00, retorno: 22/05/2024 18:00, Campinas, Reunião técnica - com solicitação de diarias"
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
              description: "Linhas formatadas iniciando pela Data, com lógica condicional e limpeza de sigla/parênteses."
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
    if (error.message?.includes("API key")) {
        throw new Error("A chave de API configurada é inválida ou não tem permissão para usar este modelo.");
    }
    throw new Error(error.message || "Falha ao processar o texto. Verifique sua conexão e se o conteúdo é válido.");
  }
};
