const jsonfile = require('jsonfile');
const moment = require('moment');
const simpleGit = require('simple-git');
const FILE_PATH = './data.json';

const makeCommit = (n) => {
  if (n === 0) return simpleGit().push();

  const x = Math.floor(Math.random() * 54);
  const y = Math.floor(Math.random() * 7);

  const DATE = moment().subtract(1, 'y').add(x, 'weeks').add(y, 'days').format();

  const data = { date: DATE };

  jsonfile.writeFile(FILE_PATH, data, () => {
    simpleGit().add([FILE_PATH]).commit(DATE, { '--date': DATE }, makeCommit.bind(this, --n));
  });
};

makeCommit(10); // number of commits