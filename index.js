const path = require('path');
const jsonfile = require('jsonfile');
const moment = require('moment');
const simpleGit = require('simple-git');

const FILE_PATH = path.resolve(__dirname, 'data.json');
const git = simpleGit({ baseDir: __dirname });

const args = process.argv.slice(2);

const hasFlag = (flag) => args.includes(flag);

const getArgValue = (flag, fallback) => {
  const index = args.indexOf(flag);

  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
};

const parsePositiveInt = (value, name) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer. Received "${value}".`);
  }

  return parsed;
};

const commitCount = parsePositiveInt(getArgValue('--count', '200'), '--count');
const daysWindow = parsePositiveInt(getArgValue('--days', '365'), '--days');
const noPush = hasFlag('--no-push');
const dryRun = hasFlag('--dry-run');

const randomInt = (max) => Math.floor(Math.random() * max);

const randomDate = () =>
  moment()
    .subtract(randomInt(daysWindow), 'days')
    .startOf('day')
    .add(randomInt(1440), 'minutes')
    .format();

const ensureRepoState = async () => {
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new Error('Current directory is not a git repository.');
  }

  if (!noPush && !dryRun) {
    const remotes = await git.getRemotes(true);

    if (remotes.length === 0) {
      throw new Error('No git remote found. Add a remote or run with --no-push.');
    }
  }
};

const createCommit = async (index) => {
  const date = randomDate();

  if (dryRun) {
    console.log(`[dry-run] commit ${index + 1}/${commitCount} -> ${date}`);
    return;
  }

  const data = {
    date,
    sequence: index + 1,
  };

  await jsonfile.writeFile(FILE_PATH, data, { spaces: 2 });

  process.env.GIT_AUTHOR_DATE = date;
  process.env.GIT_COMMITTER_DATE = date;

  await git.add([FILE_PATH]);
  await git.commit(`chore: backfill commit ${index + 1}`, { '--date': date });

  console.log(`created commit ${index + 1}/${commitCount} -> ${date}`);
};

const main = async () => {
  if (!dryRun) {
    await ensureRepoState();
  }

  for (let i = 0; i < commitCount; i += 1) {
    await createCommit(i);
  }

  if (dryRun || noPush) {
    console.log('done (push skipped)');
    return;
  }

  await git.push();
  console.log('done (all commits pushed)');
};

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
});
