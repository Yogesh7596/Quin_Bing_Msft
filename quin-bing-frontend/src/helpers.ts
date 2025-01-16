function formatFileSize(sizeInBytes) {
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;
    if (sizeInMB >= 0.1) {
        return sizeInMB.toFixed(2) + ' MB';
    } else {
        return sizeInKB.toFixed(2) + ' KB';
    }
}

const setAnswerFromStream = async (stream: ReadableStream, setAnswer) => {
    const reader = stream.getReader();
    const textDecoder = new TextDecoder('utf-8');
    let accumulator = [];
    let jsonString = ""
    
    try {
        while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        jsonString = jsonString + textDecoder.decode(value);

        let jsonStrings = jsonString.split('data: ');

        // Filter out empty strings and parse each JSON string
        jsonStrings = jsonStrings
        .filter(str => str.trim() !== '')

        // Remove empty strings
        jsonStrings.map(str => {
        try {
            
            const obj = JSON.parse(str);
            if (Object.keys(obj || {}).length > 0) {
                accumulator.push(obj);
                jsonString = ""
            }
        } catch {

        }
        });     // Parse each JSON string
        const result = accumulator.reduce((result, currentObject) => {
          // Get the key and value of the current object
        const [key, value] = Object.entries(currentObject)[0];

          // Add the key-value pair to the result object
        result[key] = value;
        return result;
        }, {});
        // if (result?.credit_balance?.["credit_balance"]) {
        //     setCreditBalance(result?.credit_balance?.["credit_balance"])
        // }
        setAnswer(result);
    }
    } catch (error) {
        console.error("Error while streaming:", error);
    } finally {
        reader.releaseLock();
    }
};


export {formatFileSize, setAnswerFromStream};