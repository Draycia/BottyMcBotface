import fs = require("fs");

export default class DataStream {
  private moduleName: string;
  private directory: string;

  constructor(name?: string) {
    //-> If provided, assign 'this.moduleName' to the 'name' Constructor arrgument.
    if (name) {
      this.moduleName = name
    } else if (module.parent && module.parent.filename) {
      //-> If not provided, use the Node Keywords to get the current file.
      let file = module.parent.filename;
      //-> Split to get just the name of the file, not the entire path.
      let fileArray = file.split("\\").reverse();
      //-> Assign 'moduleName' to the determined name of the file.
      this.moduleName = fileArray[0].slice(0, fileArray[0].lastIndexOf('.'));
    }
    //-> Use the 'moduleName' to define the directory for the Module's data.
    this.directory = `./src/Modules/${this.moduleName}/Data/`;
    //-> Create the Directory if it doesn't already exist.
    this.checkDirectory();
  }

  public get(fileName: string, path?: string) {
    //-> Logging.
    console.log(`Getting data for file ${fileName}.`);
    //-> Get the absolute relative path for the given File.
    let filePath = this.directory + fileName;
    //-> Ensure the corrresponding Directory and Files exist before proceeding.
    this.doChecks(filePath);
    //-> Read the contents of the provided File name at the Directory 'filePath'.
    let fileContents = fs.readFileSync(filePath, "utf8");
    //-> Return null if 'fileContents' is blank / not defined ("").
    if (fileContents === "")
      return null;
    //-> Return data if 'path' exists.
    if (path)
      return this.getByString(fileContents, path);
    //-> Return parsed JSON object of string 'fileContents'.
    return JSON.parse(fileContents);
  }

  public set(fileName: string, data: any, path?: string) {
    //-> Logs, showing that it triggered, and the name of the file it is saving data for.
    console.log(`Saving data for file ${fileName}.`);
    //-> If path exists / is defined.
    if (path) {
      //-> Retrieves the 'old' data, otherwise if data for it doesn't exist instantiate it with a new empty object.
      let oldData = this.get(fileName) || {};
      //-> 
      this.setByString(oldData, data, path);
      //-> Set 'data' to the modified 'oldData'.
      data = oldData;
    }
    //-> Get the absolute relative path for saving the File.
    let filePath = this.directory + fileName;
    //-> Ensure the corrresponding Directory and Files exist before proceeding.
    this.doChecks(filePath);
    //-> Save json Data to File.
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private doChecks(fileNamePath: string) {
    //-> Create the Directory if it doesn't exist.
    this.checkDirectory();
    //-> If the file doesn't exist.
    if (!fs.existsSync(fileNamePath)) {
      //-> Logs, indicating that it indeed did (or didn't if it doesn't log this) have to create the File. 
      console.log(`File ${fileNamePath} does not exist, creating it now!`);
      //-> Create File with empty contents.
      fs.writeFileSync(fileNamePath, "");
    }
  }

  private checkDirectory() {
    //-> If the path 'this.directory' doesn't exist.
    if (!fs.existsSync(this.directory)) {
      //-> Logs, indicating that it indeed did (or didn't if it doesn't log this) have to create the Directory.
      console.log(`Directory ${this.directory} does not exist, creating it now!`);
      //-> Create the Directory.
      fs.mkdirSync(this.directory);
    }
  }

  private getByString(obj: any, path: string) {
    //-> Recurrsively iterate through each split part of the 'path', indexing the previous object
    //-> with the current as a key until finally the last indexed object's value is returned. 
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private setByString(obj: any, value: any, path: string) {
    //-> Split into parts for iteration.
    let pathBuffer = path.split('.');
    //-> Loop through recursively, indexing the previously assigned object 'obj' with the current split part of 'pathBuffer'.
    for (var i = 0; i < pathBuffer.length - 1; i++)
      obj = obj[pathBuffer[i]];
    //-> Assign the indexed final indexed object's property to 'value'.
    obj[pathBuffer[pathBuffer.length - 1]] = value;
  }
}