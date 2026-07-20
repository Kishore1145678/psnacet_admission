import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres' });
client.connect().then(() => {
  return client.query("ALTER TABLE students ADD COLUMN blood_group TEXT DEFAULT '';");
}).then(() => {
  console.log('Column added');
  process.exit(0);
}).catch(e => {
  console.log(e.message);
  process.exit(0);
});
