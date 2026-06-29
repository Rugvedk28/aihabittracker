const store = globalThis.__mockDbStore ?? {
  users: [],
  habits: [],
  logs: [],
};

globalThis.__mockDbStore = store;

export const setMockDbMode = (enabled) => {
  globalThis.__useMockDb = enabled;
};

export const isMockDb = () => globalThis.__useMockDb === true;

export const getMockStore = () => store;

export const matchesQuery = (doc, query = {}) => {
  return Object.entries(query).every(([key, expected]) => {
    const actual = doc?.[key];

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (Object.prototype.hasOwnProperty.call(expected, "$in")) {
        return expected.$in.some((value) => String(value) === String(actual));
      }
    }

    return String(actual) === String(expected);
  });
};

export const createMockQuery = (results) => {
  const rows = Array.isArray(results) ? results : [];

  return {
    sort(sortSpec = {}) {
      const entries = Object.entries(sortSpec);
      if (!entries.length) {
        return createMockQuery(rows);
      }

      const sorted = [...rows].sort((a, b) => {
        for (const [field, direction] of entries) {
          const left = a?.[field];
          const right = b?.[field];
          if (left === right) continue;

          const compare =
            typeof left === "string" && typeof right === "string"
              ? left.localeCompare(right)
              : Number(left) - Number(right);

          if (compare !== 0) {
            return direction < 0 ? -compare : compare;
          }
        }
        return 0;
      });

      return createMockQuery(sorted);
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(rows).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return Promise.resolve(rows).catch(onRejected);
    },
    exec() {
      return Promise.resolve(rows);
    },
  };
};
