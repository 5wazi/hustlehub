// Tiny file-backed collection (stand-in for MongoDB collections).
// Controllers only use this interface, so swapping in Mongoose later is a
// contained change.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');

function createCollection(fileName) {
  const file = path.join(DATA_DIR, fileName);

  const all = () => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Failed to read ${fileName}:`, err.message);
      return [];
    }
  };

  const save = (items) => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf-8');
  };

  return {
    all,
    findById: (id) => all().find((item) => item.id === id),
    filter: (predicate) => all().filter(predicate),
    insert(data) {
      const items = all();
      // id/createdAt come last so callers can never override them
      const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      items.push(item);
      save(items);
      return item;
    },
    update(id, patch) {
      const items = all();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...patch, id, updatedAt: new Date().toISOString() };
      save(items);
      return items[index];
    },
    remove(id) {
      const items = all();
      const next = items.filter((item) => item.id !== id);
      if (next.length === items.length) return false;
      save(next);
      return true;
    },
  };
}

module.exports = { createCollection };
