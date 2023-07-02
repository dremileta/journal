import { PromptTemplate } from 'langchain';
import { Document } from 'langchain/document';
import { loadQARefineChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAI } from 'langchain/llms/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    sentimentScore: z
      .number()
      .describe(
        'sentiment of the text and rated on scale from -10 to 10, where -10 is extrimely negative, 0 is neutral, and 10 is extrimely positive. '
      ),
    mood: z
      .string()
      .describe('the mood of the person who wrote the journal entry.'),
    subject: z.string().describe('the subject of the journal entry'),
    summary: z.string().describe('quick summary of the entire entry.'),
    color: z
      .string()
      .describe(
        'a hexidecimal color code that repesents the mood of the entry. Example #0101fe for blue representing happiness.'
      ),
    negative: z
      .boolean()
      .describe(
        'is the journal entry negative? (i.e does it contain negative emotions?).'
      ),
  })
);

const getPrompt = async (content: string) => {
  const format_instructions = parser.getFormatInstructions();

  const prompt = new PromptTemplate({
    template: `
      Analyze the following journal entry. 
      Follow the instructions and format your response to match the format instructions, no matter what! \n
      {format_instructions}\n{entry}
    `,
    inputVariables: ['entry'],
    partialVariables: { format_instructions },
  });

  const input = await prompt.format({
    entry: content,
  });

  return input;
};

export const analyze = async (content: string) => {
  const input = await getPrompt(content);
  const model = new OpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo',
  });
  const result = await model.call(input);

  try {
    return parser.parse(result);
  } catch (e) {
    console.log('--- [LOG: error] ---', e);
  }
};

/**
 * What we want to achieve here?
 * - We want ask a question using openai, but only in context of all our journal entries.
 *
 * And the problem with that functionality and LLMs, and with openai particularly is
 * that it has limited amount of tokens that is possible to give as a prompt input (you can think of token as 4 letter = 1 token).
 *
 * So there are some solutions to this problem:
 * - maybe we dont need "everything" (in our case every single journal entry) to be able to answer the question
 *  (for example if you asking about specific date and time);
 * - we can also make multiple gpt calls, each call will be filled with context info until it is aware of all of the entries;
 *  (for example, use recursive: feed some context -> ask question -> get asnwer -> feed more context ->
 *  ask question like "is this asnwer is still valid based on new context" -> ...)
 *
 * Here we will use 1st solution. And for that we should use something like Vector Database.
 * Its an array of numbers, like a range from 1 - 0.
 *
 * So we basically will take our journal entries and convert them into embedings (colelction of vectors).
 * Each "text" will be represented as a number in our vector databse.
 *
 * Then we will take our question and convert that to a number and we will put that into vector database.
 * So for example in our vector database we have 2 embedings (or numbers). When we take another number (question)
 * to our vector database - we can do math to decide which number is closest to (question).
 */
export const qa = async (question: string, entries: any) => {
  // 1. We will turn everything to langchain Document
  // just an object with some metadata so the ai know where it learn information from.
  const docs = entries.map((entry) => {
    return new Document({
      pageContent: entry.content,
      metadata: {
        id: entry.id,
        createdAt: entry.createdAt,
      },
    });
  });

  // 2. Then we will create a model
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' });

  // 3. Then we will create a chain. It allows you to chain multiple LLM calls.
  // loadQARefineChain - RefineDocumentsChain (google it for more info)
  const chain = loadQARefineChain(model);

  // 4. Create embeddings (group of vectors). This particular function will call openai api to create those embeddings
  const embeddings = new OpenAIEmbeddings();
  // 5. Store those documents in our memory vector database
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  // 6. Then we will perform similarity search. (at this point we know what entries do we need to answer the question)
  const relevantDocs = await store.similaritySearch(question);
  // 7. Final result call with data from similarity search
  const result = await chain.call({
    input_documents: relevantDocs,
    question,
  });

  return result.output_text;
};
