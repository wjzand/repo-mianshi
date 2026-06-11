import { openDB as idbOpenDB, IDBPDatabase, DBSchema } from 'idb';
import { Interview } from '../types/interview';
import { Question } from '../types/question';
import { UserProfile } from '../types/profile';
import { DiaryEntry } from '../types/diary';
import { SimulationReport, FailQuestion } from '../types/simulation';

interface InterviewAssistantDBSchema extends DBSchema {
  interviews: {
    key: string;
    value: Interview;
    indexes: {
      company: string;
      position: string;
      result: string;
      interviewDate: string;
      createdAt: string;
    };
  };
  questions: {
    key: string;
    value: Question;
    indexes: {
      category: string;
      positionType: string;
      isCustom: string;
    };
  };
  diary: {
    key: string;
    value: DiaryEntry;
    indexes: {
      date: string;
      type: string;
    };
  };
  profile: {
    key: string;
    value: UserProfile;
  };
  simulations: {
    key: string;
    value: SimulationReport;
    indexes: {
      createdAt: string;
    };
  };
  failQuestions: {
    key: string;
    value: FailQuestion;
    indexes: {
      dimension: string;
      source: string;
    };
  };
}

export type InterviewAssistantDB = IDBPDatabase<InterviewAssistantDBSchema>;

const DB_NAME = 'InterviewAssistantDB';
const DB_VERSION = 2;

let dbInstance: InterviewAssistantDB | null = null;

export async function openDB(): Promise<InterviewAssistantDB> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await idbOpenDB<InterviewAssistantDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('interviews')) {
          const interviewsStore = db.createObjectStore('interviews', { keyPath: 'id' });
          interviewsStore.createIndex('company', 'company', { unique: false });
          interviewsStore.createIndex('position', 'position', { unique: false });
          interviewsStore.createIndex('result', 'result', { unique: false });
          interviewsStore.createIndex('interviewDate', 'interviewDate', { unique: false });
          interviewsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('questions')) {
          const questionsStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionsStore.createIndex('category', 'category', { unique: false });
          questionsStore.createIndex('positionType', 'positionType', { unique: false });
          questionsStore.createIndex('isCustom', 'isCustom', { unique: false });
        }
        if (!db.objectStoreNames.contains('diary')) {
          const diaryStore = db.createObjectStore('diary', { keyPath: 'id' });
          diaryStore.createIndex('date', 'date', { unique: false });
          diaryStore.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('simulations')) {
          const simStore = db.createObjectStore('simulations', { keyPath: 'id' });
          simStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('failQuestions')) {
          const fqStore = db.createObjectStore('failQuestions', { keyPath: 'id' });
          fqStore.createIndex('dimension', 'dimension', { unique: false });
          fqStore.createIndex('source', 'source', { unique: false });
        }
      }
    },
  });

  dbInstance = db;
  return db;
}

type StoreMethod = 'getAll' | 'get' | 'add' | 'put' | 'delete' | 'clear';

type StoreName = 'interviews' | 'questions' | 'diary' | 'profile' | 'simulations' | 'failQuestions';

type StoreValue<S extends StoreName> = 
  S extends 'interviews' ? Interview :
  S extends 'questions' ? Question :
  S extends 'diary' ? DiaryEntry :
  S extends 'profile' ? UserProfile :
  S extends 'simulations' ? SimulationReport :
  S extends 'failQuestions' ? FailQuestion :
  never;

function createStoreWrapper<S extends StoreName>(storeName: S) {
  type T = StoreValue<S>;
  const execute = async <R>(method: StoreMethod, ...args: any[]): Promise<R> => {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store as any;
    const result = await store[method](...args);
    await tx.done;
    return result as R;
  };

  const bulkAdd = async (values: any[]): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all(values.map((v) => tx.store.add(v)));
    await tx.done;
  };

  return {
    getAll: () => execute<T[]>('getAll'),
    get: (key: string) => execute<T | undefined>('get', key),
    add: (value: T) => execute<IDBValidKey>('add', value),
    put: (value: T) => execute<IDBValidKey>('put', value),
    delete: (key: string) => execute<void>('delete', key),
    clear: () => execute<void>('clear'),
    bulkAdd,
  };
}

export const interviewDB = createStoreWrapper('interviews');
export const questionDB = createStoreWrapper('questions');
export const diaryDB = createStoreWrapper('diary');
export const profileDB = createStoreWrapper('profile');
export const simulationDB = createStoreWrapper('simulations');
export const failQuestionDB = createStoreWrapper('failQuestions');
