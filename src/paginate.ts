export class MsgPagination {
    public itemsPerPage: number = 6;
    public content: Array<ContentCache> = new Array<ContentCache>();

    /**
     * @description Adds a predefined ('constant'-esk) string[] with a specified id.
     *              More efficient than passing content directly unless it changes.
     * @param id: "Any string that will be used to call this cached data."
     * @param content: "Array of strings that will be sliced according to the specified range."
     */
    public addStaticContent(id: string, content: string[]) {
        // If the content with the same 'id' exists, return
        const any:boolean = this.content.some(c => c.id === id);
        if (any) return;
        // Add string[] with specified 'id' to array of cached data
        this.content.push(new ContentCache(id, content));
    }

    /**
     * @description Returns content that is sliced to specified range.
     * @param callback Function with which the output will be returned through.
     * @param content Array of strings that will be sliced according to the specified range.
     * @param pageNum Quite obvious isn't it? The page number in which you want to get the range of string from.
     *                -Optional- will use the class default.
     * @param perPage Quite obvious isn't that as well? The length of the range of string to return.
     *                -Optional- will use 1 as a default.
     */
    public paginateFromContent(callback: Function, content: string[], pageNum?: number, perPage?: number) {
        // If undefined, use class default
        perPage = (perPage ? perPage : this.itemsPerPage);
        // If undefined, use default: 1
        pageNum = (pageNum ? pageNum : 1);
        // Slice Array<string[]> to include strictly only the specified range
        callback(content.slice(perPage * (pageNum - 1), perPage * pageNum));
    }

    /**
     * @description Returns content that is sliced to specified range.
     * @param callback Function with which the output will be returned through.
     * @param id String value that is used in fetching the data.
     * @param pageNum Quite obvious isn't it? The page number in which you want to get the range of string from.
     *                -Optional- will use the class default.
     * @param perPage Quite obvious isn't that as well? The length of the range of string to return.
     *                -Optional- will use 1 as a default.
     */
    public paginateFromId(callback: Function, id: string, pageNum?: number, perPage?: number) {
        // If undefined, use class default
        perPage = (perPage ? perPage : this.itemsPerPage);
        // If undefined, use default : 1
        pageNum = (pageNum ? pageNum : 1);
        // Find content by given 'id', if unable then return
        const cachedContent = this.content.find(c => c.id === id);
        if (!cachedContent) return;
        
        // Slice Array<string[]> to include strictly only the specified range
        callback(cachedContent.content.slice(perPage * (pageNum - 1), perPage * pageNum))
    }
}

// 'ContentCache' is the cached objects stored via array within class 'MsgPagination'
export class ContentCache {
    // 'id' can be any string value that is used in fetching the data
    public id: string;
    // 'content' is the string array that is the data to sliced to the specified range
    public content: string[] = new Array<string>();
    constructor(i: string, c: string[]) {
        this.id = i; 
        c.forEach(s => this.content.push(s));
    }
}