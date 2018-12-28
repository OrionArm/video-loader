#!/usr/bin/env node
const sys = require("util");
const exec = require("child_process").exec;
const fs = require("fs");
const csv = require("fast-csv");
const shell = require("shelljs");

console.log("start script");
const csvPath = "/home/user/Documents/link-base.csv";
const writeInFile = (fileName, text) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, text, function(err) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve();
    });
  });
};

const createFolders = path => {
  console.log("create folder", path);
  shell.mkdir("-p", path);
};

const execCommand = (command, callback) => {
  return new Promise((resolve, reject) => {
    const options = { maxBuffer: 1024 * 50000 }
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.log("exec error: " + error);
      }
      resolve(callback(stdout));
    });
  });
};

const createDatabase = csvPath => {
  const stream = fs.createReadStream(csvPath);
  const dataBase = [];
  return new Promise((resolve, reject) => {
    csv
      .fromStream(stream, { ignoreEmpty: true })
      // csv head [ 'id', 'name', 'type', 'category', 'link' ]
      .transform(row => ({
        id: row[0],
        name: row[1],
        type: row[2],
        category: row[3],
        links: row[4]
      }))
      .on("data", data => {
        dataBase.push(data);
      })
      .on("end", () => {
        console.log("reading scv done");
        resolve(dataBase);
      });
  });
};

const createVideoDirectory = directory => `./loaded-videos/${directory}/`;
const videoTitle = "%(autonumber)s-%(title)s.%(ext)s";
const command = url =>
  `youtube-dl -i -o "${url}" -a list.txt --cookie ~/Documents/cookies.txt`;

(async function main(csvPath) {
  const [tableHead, ...database] = await createDatabase(csvPath);

  for (let entity of database) {
    let videoDirectory;
    if (entity.type === "lesson") {
      videoDirectory = createVideoDirectory(`${entity.category}/lessons/`);
    } else {
      videoDirectory = createVideoDirectory(
        `${entity.category}/${entity.name}/`
      );
    }
    createFolders(videoDirectory);
    const videoUrl = videoDirectory + videoTitle;
    await writeInFile("list.txt", entity.links);
    console.time(videoUrl);
    console.log("start load ", entity.name);
    await execCommand(command(videoUrl), stdout =>
      console.log("Callback done", stdout)
    );
    console.timeEnd(videoUrl);
    console.log("________________________________");
  }
})(csvPath);
