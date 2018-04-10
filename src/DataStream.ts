import fs = require("fs");

export default class DataStream {
  private moduleName: string;
  private directory: string;

  constructor(name?: string) {
    if (name) this.moduleName = name;
    else if (module.parent && module.parent.filename) {
      let file = module.parent.filename;
      let fileArray = file.split("\\");
      this.moduleName = fileArray[fileArray.length - 1].substring(0, fileArray[fileArray.length - 1].length - 3);
    }
    this.directory = `./src/Modules/${this.moduleName}/Data/`;
    this.checkDirectory();
  }

  public get(fileName: string) {
    console.log(`Getting data for file ${fileName}.`);
    let filePath = this.directory + fileName;
    this.doChecks(filePath);
    let fileContents = fs.readFileSync(filePath, "utf8");
    return fileContents === "" ? {} : JSON.parse(fileContents);
  }

  public set(fileName: string, data: any) {
    console.log(`Saving data for file ${fileName}.`);
    let filePath = this.directory + fileName;
    this.doChecks(filePath);
    fs.writeFileSync(filePath, data);
  }

  private doChecks(fileNamePath: string) {
    // If someone deleted the directory before this is called.
    this.checkDirectory();

    if (!fs.existsSync(fileNamePath)) { 
      console.log(`File ${fileNamePath} does not exist, creating it now!`);
      fs.writeFileSync(fileNamePath, "");
    }
  }

  private checkDirectory() {
    if (!fs.existsSync(this.directory)) {
      console.log(`Directory ${this.directory} does not exist, creating it now!`);
      fs.mkdirSync(this.directory);
    }
  }
}