
const ProgressBar = require('./src/utils/ProgressBar');
const pb = new ProgressBar('Archiving...', 20);

let i = 0;
setInterval( () => {
  i++;
  pb.render({
    percent: i/100,
    completed: i,
    total: 100,
  })
}, 1000)
