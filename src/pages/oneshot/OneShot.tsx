import { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  ChoiceGroup,
  IChoiceGroupOption,
  Panel,
  DefaultButton,
  Spinner,
  TextField,
  SpinButton,
  IDropdownOption,
  Dropdown,
  IComboBox,
  ComboBox,
} from "@fluentui/react";
import RetravierLogo from "../../assets/Quin_Logo.png";
import styles from "./OneShot.module.scss";
import Button from "react-bootstrap/Button";
import React from "react";
import {
  askApi,
  getInsightsApi,
  Approaches,
  AskResponse,
  AskRequest,
  RetrievalMode,
  updateFeedBack,
  updateFeedBackRequest,
  getAzureInsightsApi,
} from "../../api";
import { Answer, AnswerError } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import {
  AnalysisPanel,
  AnalysisPanelTabs,
} from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton/SettingsButton";
import { trackPromise } from "react-promise-tracker";
import categoryService from "../../api/categoryService";
// import useCredit from "../../contextProviders/creditProvider/useCredit";
import { File } from "buffer";
import { setAnswerFromStream } from "../../helpers";

let baseURL = import.meta.env.VITE_APP_API_URL

export function Component(props): JSX.Element {
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [approach, setApproach] = useState<Approaches>(
    Approaches.RetrieveThenRead
  );
  const [promptTemplate, setPromptTemplate] = useState<string>("");
  const [promptTemplatePrefix, setPromptTemplatePrefix] = useState<string>("");
  const [promptTemplateSuffix, setPromptTemplateSuffix] = useState<string>("");
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(
    RetrievalMode.Hybrid
  );
  const [retrieveCount, setRetrieveCount] = useState<number>(3);
  const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(false);
  const [useSemanticCaptions, setUseSemanticCaptions] =
    useState<boolean>(false);

  const lastQuestionRef = useRef<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [answer, setAnswer] = useState<AskResponse>();
  const [userQuestion, setUserQuestion] = useState<string>("");

  const [activeCitation, setActiveCitation] = useState<string>();
  const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<
    AnalysisPanelTabs | undefined
  >(undefined);

  const [categoryList, setcategoryList] = useState<any>([]);
  const [comboBoxOptions, setComboBoxOptions] = useState<any>([]);
  const comboBoxRef = useRef<IComboBox>(null);
  const [excludeCategory, setExcludedCategory] = useState<any>([]);
  const [question, setQuestion] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [explainCode, setExplainCode] = useState(false);
  const [showPlot, setShowPlot] = useState(false);
  // const { creditBalance, setCreditBalance } = useCredit()
  const checkboxColor = "#3F5AA4 !important"

  const customCheckboxStyle = {
    root: {
      selectors: {
        'ms-Checkbox-checkbox': {
          backgroundColor: checkboxColor,
        },
      },
    },
  };

  const customSpinnerStyles = {
    root: {
      // Customize the container style
      fontWeight: 500,
      display: "flex",
    },
    circle: {
      // Customize the circle (spinner) style
      fontSize: '70px',
      fontWeight: 500,
      borderWidth: "3px",
    },
    label: {
      fontSize: "17px",
      fontWeight: 500
    }
  }

  const getCategoryList = () => {
    trackPromise(
      categoryService.getCategory({ status_flag: 1 }).then((res) => {
        let existingCategory = [];
        let catergoryList2 = [...res?.data?.CategoryList];
        setcategoryList(catergoryList2);
        let comboboxoptions: any = [];
        catergoryList2.forEach((category) => {
          comboboxoptions.push({
            key: category.id,
            text: category.category_name,
          });
        });
        setComboBoxOptions(comboboxoptions);
      })
    );
  };

  const getInsightsRequest = async () => {
    setAnswer(null);
    lastQuestionRef.current = question;
    setUserQuestion(question);
    error && setError(undefined);
    setIsLoading(true);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);
    const { selectedFileName } = props

    try {

      if (creditBalance <= 0) {
        // Display an alert indicating insufficient balance
        alert('Insufficient balance. Please recharge your account.');
        return;
      }
      else if (!selectedFileName || typeof (selectedFileName) !== "string") {
        alert("Please select file from the Uploaded files list");
        return;
      }
      else {
        let email; // Declare the variable
        const storedResponse = localStorage.getItem('msalResponse');
        const parsedResponse = JSON.parse(storedResponse);
        email = parsedResponse.account.username;
        const question_prompt = question


        const response = await fetch(baseURL + "/api/get_insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            question_prompt: question_prompt,
            file_name: props.selectedFileName,
            show_code: showCode,
            explain_code: explainCode,
            showPlot:showPlot
          })
        });

        if (!response.ok) {
          throw Error(response.statusText || "Unknown error");
        }

        // Check if the Response object has the `body` property with a ReadableStream
        if (response.body && response.body instanceof ReadableStream) {
          await setAnswerFromStream(response.body, setAnswer, setCreditBalance);

          // const result = await response.json();

          // setAnswer(result);
          // setCreditBalance(result?.credit_balance?.credit_balance)
        }

      }

    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getDatabricksInsightsRequest = async () => {
    setAnswer(null);
    lastQuestionRef.current = question;
    setUserQuestion(question);
    setError(undefined);
    setIsLoading(true);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);
    const { selectedFileName } = props

    try {

      if (creditBalance <= 0) {
        // Display an alert indicating insufficient balance
        alert('Insufficient balance. Please recharge your account.');
        return;
      }
      else if (!selectedFileName || typeof (selectedFileName) !== "string") {
        alert("Please select file from the Uploaded files list");
        return;
      }
      else {
        let email; // Declare the variable
        const storedResponse = localStorage.getItem('msalResponse');
        const parsedResponse = JSON.parse(storedResponse);
        email = parsedResponse.account.username;
        const question_prompt = question
        const response = await fetch(baseURL + "/api/get_insights_databricks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            question_prompt: question_prompt,
            file_name: props.selectedFileName,
            show_code: showCode,
            explain_code: explainCode
          })
        });

        if (!response.ok) {
          throw Error(response.statusText || "Unknown error");
        }

        // Check if the Response object has the `body` property with a ReadableStream
        if (response.body && response.body instanceof ReadableStream) {
          await setAnswerFromStream(response.body, setAnswer, setCreditBalance);
        }
        //const result = await response.json();
        //console.log("result", result)
        //setAnswer(result);
        //setCreditBalance(result?.credit_balance?.credit_balance)
      }

    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getAzureInsightsRequest = async () => {
    setAnswer(null);
    lastQuestionRef.current = question;
    setUserQuestion(question);
    error && setError(undefined);
    setIsLoading(true);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);
    const { database, selected_tables } = props

    try {

      // if (creditBalance <= 0) {
      //   // Display an alert indicating insufficient balance
      //   alert('Insufficient balance. Please recharge your account.');
      //   return;
      // }
      if (!database || selected_tables.length < 1) {
        alert("Please select tables from database");
        return;
      }
      else {
        let email; // Declare the variable
        const storedResponse = localStorage.getItem('email');
        const parsedResponse = storedResponse;
        email = parsedResponse
        const question_prompt = question
        // console.log(question_prompt,email,database,selected_tables,showCode,showPlot)
        // const result = await getInsightsApi(email, question_prompt, props.selectedFileName, showCode, explainCode);
        const response = await fetch(baseURL + "/generate_insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_query: question_prompt,
            explain_code: explainCode,
            is_plot: showPlot,
            show_code:showCode
          })
        });

        if (!response.ok) {
          throw Error(response.statusText || "Unknown error");
        }

        // Check if the Response object has the `body` property with a ReadableStream
        if (response.body && response.body instanceof ReadableStream) {
          await setAnswerFromStream(response.body, setAnswer);
         // console.log(response.body)
        }
        //const result = await response.json();
        //console.log("re a", result);
        //setAnswer(result);
        //setCreditBalance(result?.credit_balance?.credit_balance)
      }

    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

 
  const getGCPInsightsRequest = async () => {
    setAnswer(null);
    lastQuestionRef.current = question;
    setUserQuestion(question);
    error && setError(undefined);
    setIsLoading(true);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);
    const { database, selected_tables, sample_data, join_query } = props

    try {

      if (creditBalance <= 0) {
        // Display an alert indicating insufficient balance
        alert('Insufficient balance. Please recharge your account.');
        return;
      }
      else if (!database || !selected_tables) {
        alert("Please select file from the Uploaded files list");
        return;
      }
      else {
        let email; // Declare the variable
        const storedResponse = localStorage.getItem('msalResponse');
        const parsedResponse = JSON.parse(storedResponse);
        email = parsedResponse.account.username;
        const question_prompt = question
        // const result = await getInsightsApi(email, question_prompt, props.selectedFileName, showCode, explainCode);
        const response = await fetch(baseURL + "/api/get_gcp_insigts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            question_prompt: question_prompt,
            database: database,
            selected_tables: selected_tables,
            sample_data: sample_data,
            join_query: join_query.trim() ? join_query : '',
            show_code: showCode,
            explain_code: explainCode
          })
        });

        if (!response.ok) {
          throw Error(response.statusText || "Unknown error");
        }

        // Check if the Response object has the `body` property with a ReadableStream
        if (response.body && response.body instanceof ReadableStream) {
          await setAnswerFromStream(response.body, setAnswer, setCreditBalance);
        }
        //const result = await response.json();
        //setAnswer(result);
        //setCreditBalance(result?.credit_balance?.credit_balance)
      }

    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    props.type === "upload_csv" ? getInsightsRequest() :
      props.type === "azure_sql_database" ? getAzureInsightsRequest() :
        props.type === "gcp" ? getGCPInsightsRequest() : getDatabricksInsightsRequest()
  }

  const onPromptTemplateChange = (
    _ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => {
    setPromptTemplate(newValue || "");
  };

  const onPromptTemplatePrefixChange = (
    _ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => {
    setPromptTemplatePrefix(newValue || "");
  };

  const onPromptTemplateSuffixChange = (
    _ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => {
    setPromptTemplateSuffix(newValue || "");
  };

  const onRetrieveCountChange = (
    _ev?: React.SyntheticEvent<HTMLElement, Event>,
    newValue?: string
  ) => {
    setRetrieveCount(parseInt(newValue || "3"));
  };

  const onRetrievalModeChange = (
    _ev: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption<RetrievalMode> | undefined,
    index?: number | undefined
  ) => {
    setRetrievalMode(option?.data || RetrievalMode.Hybrid);
  };

  const onApproachChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ) => {
    setApproach((option?.key as Approaches) || Approaches.RetrieveThenRead);
  };

  const onUseSemanticRankerChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setUseSemanticRanker(!!checked);
  };

  const onUseSemanticCaptionsChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setUseSemanticCaptions(!!checked);
  };

  const onExampleClicked = (example: string) => {
    getInsightsRequest(example);
  };

  const onShowCitation = (citation: string) => {
    if (
      activeCitation === citation &&
      activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab
    ) {
      setActiveAnalysisPanelTab(undefined);
    } else {
      setActiveCitation(citation);
      setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
    }
  };

  const onToggleTab = (tab: AnalysisPanelTabs) => {
    if (activeAnalysisPanelTab === tab) {
      setActiveAnalysisPanelTab(undefined);
    } else {
      setActiveAnalysisPanelTab(tab);
    }
  };

  const approaches: IChoiceGroupOption[] = [
    {
      key: Approaches.RetrieveThenRead,
      text: "Retrieve-Then-Read",
    },
    {
      key: Approaches.ReadRetrieveRead,
      text: "Read-Retrieve-Read",
    },
    {
      key: Approaches.ReadDecomposeAsk,
      text: "Read-Decompose-Ask",
    },
  ];

  return (
    <div className={styles.oneshotContainer} >
      <div className={styles.oneshotTopSection}>
        {/* <SettingsButton
          className={styles.settingsButton}
          onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
        /> */}
        {/* <h1 className={styles.oneshotTitle}>
          Ask
          <img
            src={RetravierLogo}
            className="d-inline-block align-left quin_logo"
            width="110px"
          />
        </h1> */}
        <div className={styles.oneshotQuestionInput}>
          <div>
            <QuestionInput
              placeholder="Type a new question"
              disabled={isLoading}
              question={question}
              setQuestion={setQuestion}
            />
          </div>
          <div className="ml-4" style={{ display: "flex", flexDirection: "column", marginLeft: "20px" }}>
            <span style={{ marginRight: '20px' }}>
              <Checkbox
                checked={showCode} 
                label="Show Code"
                styles={customCheckboxStyle}
                onChange={() => setShowCode(prev => !prev)}
              />
            </span>

            <span className="mt-2">
              <Checkbox
                checked={explainCode} 
                label="Explain Code"
                disabled={!showPlot} 
                styles={customCheckboxStyle}
                onChange={() => setExplainCode(prev => !prev)} 
              />
            </span>

            {props.type === "azure_sql_database" && (
              <span className="mt-2">
                <Checkbox
                  checked={showPlot} 
                  label="Show Plot"
                  styles={customCheckboxStyle}
                  onChange={() => {
                    setShowPlot(prev => {
                      const newValue = !prev; 
                      if (!newValue) {
                        setExplainCode(false);
                      }
                      return newValue;
                    });
                  }} // Toggle Show Plot
                />
              </span>
            )}

            <button
              className={styles.generateInsightsButton}
              style={{ marginRight: '20px', background: "gray !important" }}
              onClick={
                props.type === "upload_csv" ? getInsightsRequest :
                  props.type === "azure_sql_database" ? getAzureInsightsRequest :
                    props.type === "gcp" ? getGCPInsightsRequest : getDatabricksInsightsRequest
              }
            >Generate Insights</button>
          </div>
        </div>
      </div>
      <div className={styles.oneshotBottomSection}>
        {isLoading && !answer && < Spinner label="Generating Insights and Plots..." styles={customSpinnerStyles} />}
        {!lastQuestionRef.current && (
          <ExampleList onExampleClicked={onExampleClicked} />
        )}
        {answer && !error && (
          <div className={styles.oneshotAnswerContainer}>
            <Answer
              answer={answer}
              isLoading={isLoading}
              onCitationClicked={(x) => onShowCitation(x)}
              onThoughtProcessClicked={() =>
                onToggleTab(AnalysisPanelTabs.ThoughtProcessTab)
              }
              onSupportingContentClicked={() =>
                onToggleTab(AnalysisPanelTabs.SupportingContentTab)
              }
              question={userQuestion}
              showCode={showCode}
              explainCode={explainCode}
              onRefreshedClicked={() => getAzureInsightsRequest()}
              onRetry={retry}
            />
          </div>
        )}
        {error ? (
          <div className={styles.oneshotAnswerContainer}>
            <AnswerError
              error={"No Data"}
              onRetry={retry}
            />
          </div>
        ) : null}
        {activeAnalysisPanelTab && answer && (
          <AnalysisPanel
            className={styles.oneshotAnalysisPanel}
            activeCitation={activeCitation}
            onActiveTabChanged={(x) => onToggleTab(x)}
            citationHeight="600px"
            answer={answer}
            activeTab={activeAnalysisPanelTab}
          />
        )}
      </div>

      <Panel
        headerText="Configure answer generation"
        isOpen={isConfigPanelOpen}
        isBlocking={false}
        onDismiss={() => setIsConfigPanelOpen(false)}
        closeButtonAriaLabel="Close"
        onRenderFooterContent={() => (
          <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>
            Close
          </DefaultButton>
        )}
        isFooterAtBottom={true}
      >
        <ChoiceGroup
          className={styles.oneshotSettingsSeparator}
          label="Approach"
          options={approaches}
          defaultSelectedKey={approach}
          onChange={onApproachChange}
        />

        {(approach === Approaches.RetrieveThenRead ||
          approach === Approaches.ReadDecomposeAsk) && (
            <TextField
              className={styles.oneshotSettingsSeparator}
              defaultValue={promptTemplate}
              label="Override prompt template"
              multiline
              autoAdjustHeight
              onChange={onPromptTemplateChange}
            />
          )}

        {approach === Approaches.ReadRetrieveRead && (
          <>
            <TextField
              className={styles.oneshotSettingsSeparator}
              defaultValue={promptTemplatePrefix}
              label="Override prompt prefix template"
              multiline
              autoAdjustHeight
              onChange={onPromptTemplatePrefixChange}
            />
            <TextField
              className={styles.oneshotSettingsSeparator}
              defaultValue={promptTemplateSuffix}
              label="Override prompt suffix template"
              multiline
              autoAdjustHeight
              onChange={onPromptTemplateSuffixChange}
            />
          </>
        )}

        <SpinButton
          className={styles.oneshotSettingsSeparator}
          label="Retrieve this many documents from search:"
          min={1}
          max={50}
          defaultValue={retrieveCount.toString()}
          onChange={onRetrieveCountChange}
        />

        <ComboBox
          ref={comboBoxRef}
          defaultSelectedKey=""
          label="Exclude Categories"
          multiSelect
          options={comboBoxOptions}
          styles={{ root: { maxWidth: 300 } }}
          selectedKey={excludeCategory.map((cat) => cat.key)}
          onChange={(e, o, i, v) => {
            if (o?.selected == true) {
              setExcludedCategory([...excludeCategory, o]);
            } else {
              let newVals = excludeCategory.filter((cat) => cat.key != o?.key);
              setExcludedCategory(newVals);
            }
          }}
        />
        {
          <Checkbox
            className={styles.oneshotSettingsSeparator}
            checked={useSemanticRanker}
            label="Use semantic ranker for retrieval"
            onChange={onUseSemanticRankerChange}
          />
          /*<Checkbox
                    className={styles.oneshotSettingsSeparator}
                    checked={useSemanticCaptions}
                    label="Use query-contextual summaries instead of whole documents"
                    onChange={onUseSemanticCaptionsChange}
                    disabled={!useSemanticRanker}
                /> */
        }
        <Dropdown
          className={styles.oneshotSettingsSeparator}
          label="Retrieval mode"
          options={[
            {
              key: "hybrid",
              text: "Vectors + Text (Hybrid)",
              selected: retrievalMode == RetrievalMode.Hybrid,
              data: RetrievalMode.Hybrid,
            },
            {
              key: "vectors",
              text: "Vectors",
              selected: retrievalMode == RetrievalMode.Vectors,
              data: RetrievalMode.Vectors,
            },
            {
              key: "text",
              text: "Text",
              selected: retrievalMode == RetrievalMode.Text,
              data: RetrievalMode.Text,
            },
          ]}
          required
          onChange={onRetrievalModeChange}
        />
      </Panel>
    </div >
  );
}

Component.displayName = "OneShot";
