import { openDB as idbOpenDB, IDBPDatabase, DBSchema, IDBPObjectStore } from 'idb';
import { Interview } from '../types/interview';
import { Question } from '../types/question';
import { UserProfile } from '../types/profile';
import { DiaryEntry } from '../types/diary';

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
}

export type InterviewAssistantDB = IDBPDatabase<InterviewAssistantDBSchema>;

const DB_NAME = 'InterviewAssistantDB';
const DB_VERSION = 1;

let dbInstance: InterviewAssistantDB | null = null;

export async function openDB(): Promise<InterviewAssistantDB> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await idbOpenDB<InterviewAssistantDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('interviews')) {
        const interviewsStore = db.createObjectStore('interviews', {
          keyPath: 'id',
        });
        interviewsStore.createIndex('company', 'company', { unique: false });
        interviewsStore.createIndex('position', 'position', { unique: false });
        interviewsStore.createIndex('result', 'result', { unique: false });
        interviewsStore.createIndex('interviewDate', 'interviewDate', { unique: false });
        interviewsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('questions')) {
        const questionsStore = db.createObjectStore('questions', {
          keyPath: 'id',
        });
        questionsStore.createIndex('category', 'category', { unique: false });
        questionsStore.createIndex('positionType', 'positionType', { unique: false });
        questionsStore.createIndex('isCustom', 'isCustom', { unique: false });
      }

      if (!db.objectStoreNames.contains('diary')) {
        const diaryStore = db.createObjectStore('diary', {
          keyPath: 'id',
        });
        diaryStore.createIndex('date', 'date', { unique: false });
        diaryStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', {
          keyPath: 'id',
        });
      }
    },
  });

  dbInstance = db;
  return db;
}

type StoreMethod = 'getAll' | 'get' | 'add' | 'put' | 'delete' | 'clear';

function createStoreWrapper<T extends Interview | Question | UserProfile | DiaryEntry>(storeName: 'interviews' | 'questions' | 'diary' | 'profile') {
  const execute = async <R>(method: StoreMethod, ...args: any[]): Promise<R> => {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store as any;
    const result = await store[method](...args);
    await tx.done;
    return result as R;
  };

  const bulkAdd = async (values: T[]): Promise<void> => {
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

export const interviewDB = createStoreWrapper<Interview>('interviews');
export const questionDB = createStoreWrapper<Question>('questions');
export const diaryDB = createStoreWrapper<DiaryEntry>('diary');
export const profileDB = createStoreWrapper<UserProfile>('profile');
