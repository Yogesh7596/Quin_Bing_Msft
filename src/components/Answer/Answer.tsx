import { useEffect, useMemo, useState } from "react";
import { Stack, IconButton, Async, Spinner, Panel, PanelType, TextField } from "@fluentui/react";
import { ButtonFilled, Chat24Regular, DocumentPdf24Filled } from "@fluentui/react-icons";
import { Tooltip } from 'react-tooltip';
import Accordion from 'react-bootstrap/Accordion';
import DOMPurify from "dompurify";
import React from "react";
import ClipboardJS from 'clipboard';
import SyntaxCodeHighlighter from "./SyntaxCodeHighlighter";
import styles from "./Answer.module.scss";
import { SpeakerMute24Filled, Speaker224Filled } from "@fluentui/react-icons";
import { AskResponse, getCitationFilePath, updateFeedBack, updateFeedBackRequest } from "../../api";
import documentService from "../../api/documentService";
import { trackPromise } from "react-promise-tracker";
import { parseAnswerToHtml } from "./AnswerParser";
import { AnswerIcon } from "./AnswerIcon";
import { AnswerError } from '../Answer';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { saveAs } from 'file-saver';
import { marked } from 'marked'; // Ensure to install 'marked' package
import ReactMarkdown from 'react-markdown';


const panelStyles = {
    root: {
        selectors: {
            '@media (min-width: 768px)': {
                width: '500px', // Adjust this value as needed
                right: 0,
                left: 'auto',
            },
        },
    },
};





const chatData = [
    {
      content: `
          user_question: 1. Show retail wise total sale
          generated_sql_query: SELECT TerritoryKey,
         SUM(OrderQuantity) AS TotalSales
  FROM AdventureWorks_Sales
  GROUP BY TerritoryKey
          Score:
          `,
      role: 'assistant',
    },
    {
      content: `
          user_question: 1. Show retail wise total sale
          generated_sql_query: SELECT TerritoryKey,
         SUM(OrderQuantity) AS TotalSales
  FROM AdventureWorks_Sales
  GROUP BY TerritoryKey
          db_result: TerritoryKey,TotalSales\r\n9,17951\r\n3,30\r\n6,10894\r\n7,7862\r\n1,12513\r\n10,9694\r\n4,17191\r\n5,49\r\n2,40\r\n8,7950\r\n
          TERMINATE-AGENT
          `,
      name: 'sql_query_executor',
      role: 'user',
    },
    {
      content: `user_question: Show retail wise total sale\n
  generated_sql_query: SELECT TerritoryKey, SUM(OrderQuantity) AS TotalSales FROM AdventureWorks_Sales GROUP BY TerritoryKey\n\ninsights: The total sales figures vary significantly across different territories. For example, Territory 9 has the highest total sales with 17,951 units, while Territory 5 has the lowest with only 49 units. Territories 1 and 4 also show relatively high sales with 12,513 and 17,191 units, respectively. In contrast, multiple territories exhibit lower sales figures, indicating possible imbalances or differences in market performance across regions.\n\npython_code:\nimport pandas as pd\nimport seaborn as sns\nimport matplotlib.pyplot as plt\n\n# Assuming df is already defined with the required data\ndf = pd.DataFrame({\n 'TerritoryKey': [9, 3, 6, 7, 1, 10, 4, 5, 2, 8],\n 'TotalSales': [17951, 30, 10894, 7862, 12513, 9694, 17191, 49, 40, 7950]\n})\n\nplt.figure(figsize=(12, 6))\nbar_plot = sns.barplot(x='TerritoryKey', y='TotalSales', data=df)\nbar_plot.set_title('Retail Wise Total Sale')\nbar_plot.set_xlabel('Territory Key')\nbar_plot.set_ylabel('Total Sales')\n\nplt.show()\n`,
      name: 'insights_generator',
      role: 'user',
    },
    {
      content: `user_question: Show retail wise total sale\n\n**generated_sql_query:** SELECT TerritoryKey, SUM(OrderQuantity) AS TotalSales FROM AdventureWorks_Sales GROUP BY TerritoryKey\n\n**insights:** The total sales figures vary significantly across different territories. For example, Territory 9 has the highest total sales with 17,951 units, while Territory 5 has the lowest with only 49 units. Territories 1 and 4 also show relatively high sales with 12,513 and 17,191 units, respectively. In contrast, multiple territories exhibit lower sales figures, indicating possible imbalances or differences in market performance across regions.\n\npython_code:\nimport pandas as pd\nimport seaborn as sns\nimport matplotlib.pyplot as plt\n\n# Assuming df is already defined with the required data\ndf = pd.DataFrame({\n 'TerritoryKey': [9, 3, 6, 7, 1, 10, 4, 5, 2, 8],\n 'TotalSales': [17951, 30, 10894, 7862, 12513, 9694, 17191, 49, 40, 7950]\n})\n\nplt.figure(figsize=(12, 6))\nbar_plot = sns.barplot(x='TerritoryKey', y='TotalSales', data=df)\nbar_plot.set_title('Retail Wise Total Sale')\nbar_plot.set_xlabel('Territory Key')\nbar_plot.set_ylabel('Total Sales')\n\nplt.show()\n`,
      name: 'insights_critic',
      role: 'user',
    }
  ];





// interface Props {
//     answer: AskResponse;
//     isSelected?: boolean;
//     onCitationClicked: (filePath: string) => void;
//     onThoughtProcessClicked: () => void;
//     onSupportingContentClicked: () => void;
//     onFollowupQuestionClicked?: (question: string) => void;
//     showFollowupQuestions?: boolean;
//     question: string,
//     onRefreshedClicked: (question: string) => void;
// }

const customSpinnerStyles = {
    root: {
        // Customize the container style
        fontWeight: 500,
        display: "flex",
        flexDirection: "row",
    },
    circle: {
        // Customize the circle (spinner) style
        fontSize: '70px',
        fontWeight: 500,
        borderWidth: "3px",
        margin: "5px 10px 0 0",
    },
    label: {
        fontSize: "17px",
        fontWeight: 500
    }
}

export const Answer = ({
    answer,
    isSelected,
    onCitationClicked,
    onThoughtProcessClicked,
    onSupportingContentClicked,
    onFollowupQuestionClicked,
    showFollowupQuestions,
    question,
    onRefreshedClicked,
    isLoading,
    showCode,
    explainCode,
    onRetry,
}: Props) => {
    const AZUREAPIKEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const REGION = import.meta.env.VITE_AZURE_OPENAI_API_REGION;
    const [synth, setSynth] = useState<any>(null)
    const [startspeak, setstartSpeak] = useState<Boolean>(false)
    const [loaderMessage, setLoaderMessage] = useState("");
    // const parsedAnswer = useMemo(() => parseAnswerToHtml(answer.summary, onCitationClicked), [answer.summary]);

    // const sanitizedAnswerHtml = DOMPurify.sanitize(parsedAnswer.answerHtml);
    const [answerStatus, setAnswerStatus] = useState<number>(0);

    const [conversationPanelOpen, setConversationsPanelOpen] = useState(false);


    const sql_code_explanation = answer.sql_explanation 
    const python_code_explanation = answer.python_explanation
  
    const summary = answer.summary

    const csv_str = answer.insight_fetch

    // Getting spell data
    let spell = answer.summary
    if (answer?.sql_query) {
        spell += 'Sql query to fetch relevant data' + answer.sql_query;
    }
    if (answer.python_code) {
        spell += 'Python code to visualize relevant data' + answer.python_code;
    }
    if (answer.explanation) {
        spell += 'Code explanation' + answer.explanation
    }

    const makeUpdateFeedbackApiRequest = async (id: string, feedback: number = 0) => {
        try {
            const request: updateFeedBackRequest = {
                id,
                feedback
            };
            const result = await updateFeedBack(request);
            setAnswerStatus(feedback);
        } catch (e) {

        }
    };
    useEffect(() => {
        let synth = window.speechSynthesis;
        setSynth(synth)

        //   return ()=>{
        //     setSynth(null)
        //   }
        //   const speechConfig = sdk.SpeechConfig.fromSubscription(AZUREAPIKEY, REGION);
        //   speechConfig.speechRecognitionLanguage = "en-US";
        //   speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

        //   const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        //   const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        //   setSynth(synthesizer)
    }, [])

    const speakText = async (e, text: string) => {
        e.preventDefault();
        if (synth) {
            setstartSpeak(true)
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = speechSynthesis.getVoices().filter(function (voice) {
                // return voice.name == "Google UK English Female"
                return voice.name == "Microsoft Zira - English (United States)"

            })[0];
            synth.speak(utterance);
        }

    };

    const stopSpeak = (e) => {
        e.preventDefault();
        // WINDOWS DEFAULT METHOD
        if (synth) {
            synth.cancel();
            setstartSpeak(false)
        }

    }

    const copyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    // const downloadPdfFile = (data) => {
    //     documentService.downloadPdfFile(data).then((response) => {
           
    //     }).catch(err => {
          
    //     })
    // }
    const handleDownload = () => {
        let data = {
          "df": csv_str,  // Assuming `csv_str` is the CSV string you want to send
        };
      
        documentService.downloadcsvfFile(data)
          .then((response) => {
            // Assuming the response contains an HTML string with Base64 encoded CSV
            const { data } = response;
            
            // Use DOMParser to safely parse the HTML string and extract the Base64
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.data, 'text/html');
            const anchor = doc.querySelector('a');
      
            if (anchor && anchor.href.includes('base64,')) {
              // Extract the Base64 data from the href attribute of the anchor tag
              const base64String = anchor.href.split('base64,')[1];
      
              // Decode Base64 to binary string
              const decodedData = atob(base64String);
      
              // Create a Blob from the decoded data
              const blob = new Blob([decodedData], { type: 'text/csv' });
      
              // Create a download link
              const downloadLink = document.createElement('a');
              const url = URL.createObjectURL(blob);
              downloadLink.href = url;
              downloadLink.download = 'data.csv';  // Set your desired file name
              document.body.appendChild(downloadLink);
              downloadLink.click();
      
              // Clean up
              URL.revokeObjectURL(url);
              downloadLink.remove();
            } else {
              console.error('Download failed: Base64 data not found in response.');
            }
          })
          .catch(err => console.error('Download failed', err));
      };
      
    

    return (answer.error ? <AnswerError error={answer.error} onRetry={onRetry} /> : (
        <Stack className={`${styles.answerContainer} ${isSelected && styles.selected}`} verticalAlign="space-between">
            <Stack.Item>
                <Stack horizontal horizontalAlign="space-between">
                    {/* {answer.dbresponse != undefined ? answer.dbresponse == 0 ? <div>
                        <em data-toggle="tooltip" data-placement="top" title="This response has been generated from AI" style={{ fontSize: '20px', padding: '0px', borderRadius: '5px', color: 'rgb(115, 118, 225)' }} className="darkericons fas fa-robot"></em>
                    </div> : <div>
                        <em data-toggle="tooltip" data-placement="top" title="This response has been generated from database." style={{ fontSize: '16px', padding: '0px', borderRadius: '5px', color: 'rgb(115, 118, 225)', marginRight: '16px' }} className="darkericons fa fa-database"></em>
                    </div>
                        : <AnswerIcon />} */}

                   
                    { answer.chat_history && answer.chat_history.length > 0 ? (
                    <div className="chat-container">
                        <Chat24Regular className={styles.pointer} data-tooltip-id="chat-tooltip"  onClick={() => setConversationsPanelOpen(true)} />
                    { answer.success &&  <DocumentPdf24Filled className={styles.pointer} data-tooltip-id="pdf-tooltip" style={{ outline: 'none' }} onClick={()=>downloadPdfFile(answer.chat_history)} /> }
                        <Tooltip id="chat-tooltip" place="top" content="View Evaluation Thought Process" />
                        <Tooltip id="pdf-tooltip" place="top" content="Download the PDF version of Evaluation Thought Process" />
                    </div>
                    ) : (<></>) }

                </Stack>
            </Stack.Item>
            
            {answer.sql_query && showCode && (
                <Stack.Item grow>
                    <h5><u>SQL query to fetch relevant data</u></h5>
                    <div className={styles.code}>
                        <span
                            className={styles.clipboardButton}
                            onClick={() => copyToClipboard(answer.sql_query)}
                        >
                            <i className="fas fa-copy"></i>
                        </span>
                        <SyntaxCodeHighlighter language="sql" code={answer.sql_query} />
                    </div>
                </Stack.Item>
            )}

            {answer.sql_explanation ? <Stack.Item className="mt-2" grow>
                <Accordion className={styles.explanation} defaultActiveKey="">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header >See the code explanation</Accordion.Header>
                        <Accordion.Body>
                            <div>
                            <ReactMarkdown>{sql_code_explanation}</ReactMarkdown>
                            </div>
                            {/* <div className={styles.answerText} dangerouslySetInnerHTML={{ __html: sql_code_explanation }}></div> */}
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Stack.Item> : isLoading && explainCode && answer.summary && !answer.error && < Spinner className="mt-2" label="Generating sql explanation..." styles={customSpinnerStyles} />}
            {answer.summary ? <Stack.Item grow className="mt-2">
                <h5>Insights</h5>

                <ReactMarkdown>{summary}</ReactMarkdown>


            </Stack.Item> : isLoading && !answer.error && < Spinner className="mt-2" label="Generating summary..." styles={customSpinnerStyles} />}
            {showCode && answer.python_code && answer.python_code !== "None" && (
                <Stack.Item grow className="mt-2">
                    <h5><u>Python Code to visualize relevant data</u></h5>
                    <div className={styles.code}>
                        <span
                            className={styles.clipboardButton}
                            onClick={() => copyToClipboard(answer.python_code)}
                        >
                            <i className="fas fa-copy"></i>
                        </span>
                        <SyntaxCodeHighlighter language="python" code={answer.python_code} />
                    </div>
                </Stack.Item>
            )}

            {answer.python_explanation && answer.python_code && answer.python_code !== "None" ? (
                <Stack.Item className="mt-2" grow>
                    <Accordion className={styles.explanation} defaultActiveKey="">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>See the code explanation</Accordion.Header>
                            <Accordion.Body>
                                <div>
                                <ReactMarkdown>{python_code_explanation}</ReactMarkdown>
                                </div>
                                {/* <div
                                    className={styles.answerText}
                                    dangerouslySetInnerHTML={{ __html: python_code_explanation }}
                                ></div> */}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Stack.Item>
            ) : (
                isLoading &&
                explainCode &&
                answer.summary &&
                !answer.error && <Spinner className="mt-2" label="Generating python explanation..." styles={customSpinnerStyles} />
            )}

            {answer?.plot ? <Stack.Item grow className="mt-3">
                <h5><u>Plot to visualize relevant data</u></h5>
                <img src={`data:image/png;base64,${answer.plot}`} style={{ width: "100%" }} />
            </Stack.Item> : isLoading && answer.summary && !answer.error && <span style={{ marginTop: "50px" }}>< Spinner className="mt-2" label="Generating plot..." styles={customSpinnerStyles} /></span>}

            {answer.insight_fetch && (
            <h6
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline', marginTop:'15px' }}
                onClick={handleDownload}
            >
                Click here to Download the Data
            </h6>
            )}
            {answer.time_taken_for_explain && (
                <p style={{color:"#333",fontSize:"14px",fontStyle:'oblique',fontWeight:'600',marginBottom:'10px'}}>Time taken for explanation in seconds: {answer.time_taken_for_explain}</p>
            )}
            {answer.time_taken_for_insights && (
                <p style={{color:"#333",fontSize:"14px",fontStyle:'oblique',fontWeight:'600',marginTop:'-6px'}}>Time taken to generate insights and Python code in seconds: {answer.time_taken_for_insights}</p>
            )}
            {answer.time_taken_for_sql_execution && (
                <p style={{color:"#333",fontSize:"14px",fontStyle:'oblique',fontWeight:'600',marginTop:'-10px'}}>Time taken to execute SQL Query in seconds: {answer.time_taken_for_sql_execution}</p>
            )}
            {answer.time_taken_for_sql_query && (
                <p style={{color:"#333",fontSize:"14px",fontStyle:'oblique',fontWeight:'600',marginTop:'-10px'}}>Time taken to generate SQL Query in seconds: {answer.time_taken_for_sql_query}</p>
            )}




            {/* {!!parsedAnswer.citations.length && (
                <Stack.Item>
                    <Stack horizontal wrap tokens={{ childrenGap: 5 }}>
                        <span className={styles.citationLearnMore}>Citations:</span>
                        {parsedAnswer.citations.map((x, i) => {
                            const path = getCitationFilePath(x);
                            return (
                                <a key={i} className={styles.citation} title={x} onClick={() => onCitationClicked(path)}>
                                    {`${++i}. ${x}`}
                                </a>
                            );
                        })}
                    </Stack>

                </Stack.Item>
            )} */}

            {/* {!!parsedAnswer.followupQuestions.length && showFollowupQuestions && onFollowupQuestionClicked && (
                <Stack.Item>
                    <Stack horizontal wrap className={`${!!parsedAnswer.citations.length ? styles.followupQuestionsList : ""}`} tokens={{ childrenGap: 6 }}>
                        <span className={styles.followupQuestionLearnMore}>Follow-up questions:</span>
                        {parsedAnswer.followupQuestions.map((x, i) => {
                            return (
                                <a key={i} className={styles.followupQuestion} title={x} onClick={() => onFollowupQuestionClicked(x)}>
                                    {`${x}`}
                                </a>
                            );
                        })}
                    </Stack>
                </Stack.Item>
            )} */}
            {/* {answer.dbresponse != undefined && answer.dbresponse == 0 && <div className={styles.feedbackicons}>
                <em
                    style={{ width: 'fit-content', paddingRight: '20px' }}
                    className={
                        answerStatus === 1
                            ? "fa fa-thumbs-up thumbStyle text-success"
                            : "fa fa-thumbs-o-up thumbStyle text-success"
                    }
                    onClick={() => {
                        makeUpdateFeedbackApiRequest(answer.uid, 1);
                    }}
                ></em>
                <em
                    style={{ width: 'fit-content', paddingRight: '20px' }}
                    className={
                        answerStatus === -1
                            ? "fa fa-thumbs-down thumbStyle text-danger"
                            : "fa fa-thumbs-o-down thumbStyle text-danger"
                    }
                    onClick={() => {
                        makeUpdateFeedbackApiRequest(answer.uid, -1);
                    }}
                ></em>
            </div>} */}

        </Stack>)
    );
};
