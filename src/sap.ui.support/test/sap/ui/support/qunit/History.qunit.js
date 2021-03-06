/* global QUnit,sinon */
sap.ui.define([
	"sap/ui/support/supportRules/History",
	"sap/ui/support/supportRules/IssueManager",
	"sap/ui/support/supportRules/RuleSetLoader"],
function (History, IssueManager, RuleSetLoader) {
	"use strict";

	var oTemplateObject = {
			analysisInfo: {
				date: "",
				duration: "",
				executionScope: {
					type: "",
					selectors: ""
				},
				rulePreset: {
					id: "",
					title: "",
					description: "",
					dateExported: ""
				}
			},
			applicationInfo: [
				{
					applicationVersion: {version: ""},
					id: "",
					title: "",
					type: "",
					registrationIds: []
				},
				{
					applicationVersion: {version: ""},
					id: "",
					title: "",
					type: "",
					registrationIds: []
				}
			],
			loadedLibraries: {
				"sap.m": {
					rules: {
						breadcrumbsInOverflowToolbar: {
							audiences: [],
							categories: [],
							description: "",
							id: "",
							issues: [],
							issuesCount: "",
							minVersion: "",
							resolution: "",
							selected: ""
						}

					},
					allRulesSelected: "",
					issueCount: ""
				}
			},
			issues: [],
			technicalInfo: {title: ""},
			totalIssuesCount: ""
		},
		oTemplateForIssue = {
			context: "",
			details: "",
			name: "",
			severity: ""
		},
		sReferenceFormattedHistory = "Run1-executedonRulePreset/ID:TestPreset/TestPreset---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|ruleid:breadcrumbsInOverflowToolbar||name:BreadcrumbsinOverflowToolbar||library:sap.m||categories:Usability||audiences:Control||description:TheBreadcrumbsshouldnotbeplacedinsideanOverflowToolbar||resolution:Placebreadcrumbsinanothercontainer.|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|id|classname|status|details|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip||testId|sap.m.Button|Medium|Button'sap.m.Button'(sdk---app--feedBackDialogButton)consistsofonlyaniconbuthasnotooltip|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------";

	var compareJSON = function (oTemplateObj, oComparedObj) {
		var aKeys = (typeof oTemplateObj === "string" || !oTemplateObj) ? [] : Object.keys(oTemplateObj);
		var sError = "";

		// check all keys
		aKeys.forEach(function (sKey) {
			// if key exists
			if (oComparedObj.hasOwnProperty(sKey)) {
				//compare keys
				var bRecursive = compareJSON(oTemplateObj[sKey], oComparedObj[sKey]);
				// if they do not match, propagate error and append current key
				if (bRecursive !== true) {
					sError = sKey + " " + bRecursive;
					return false;
				}
			} else {
				// key doesn't exist? propagate error
				sError = sKey;
				return false;
			}
		});

		// if error, return error
		if (sError && sError.length > 0) {
			return sError;
		}

		return true;
	};

	var createMultipleIssues = function (iNumberOfIssues) {
		var aIssues = [];
		for (var i = 0; i < iNumberOfIssues; i++) {
			aIssues.push(createValidIssue());
		}
		return aIssues;
	};

	var createValidRule = function () {
		return {
			audiences: ["Control"],
			categories: ["Usability"],
			check: function () {
			},
			description: "The Breadcrumbs should not be placed inside an OverflowToolbar",
			enabled: true,
			id: "breadcrumbsInOverflowToolbar",
			libName: "sap.m",
			minversion: "1.34",
			resolution: "Place breadcrumbs in another container.",
			resolutionurls: [{}],
			title: "Breadcrumbs in OverflowToolbar",
			issueCount: 0,
			length: 0,
			selected: true
		};
	};

	var createValidIssue = function () {
		return {
			async: false,
			audiences: ["Control"],
			categories: ["Usability"],
			context: {className: "sap.m.Button", id: "testId"},
			description: "A button without text needs a tooltip, so that the user knows what the button does",
			details: "Button 'sap.m.Button' (sdk---app--feedBackDialogButton) consists of only an icon but has no tooltip",
			minVersion: "1.28",
			name: "Button: Consists of only an icon, needs a tooltip",
			resolution: "Add a value to the tooltip property of the button",
			resolutionUrls: [{}],
			rule: createValidRule(),
			ruleId: "breadcrumbsInOverflowToolbar",
			ruleLibName: "sap.m",
			severity: "Medium"
		};
	};

	var prepareHistoryString = function (sHistoryString) {
		// Remove white spaces for string comparison.
		var result = sHistoryString.replace(/\s/g, "");

		// We can not compare execution date, so we remove it
		result = result.replace(/executedon(.*)RulePreset/, "executedonRulePreset");

		return result;
	};

	QUnit.module("History API test", {
		beforeEach: function () {
			this.oGetIssues = sinon.stub(IssueManager, "getIssues", function () {
				return createMultipleIssues(9);
			});
			this.oGetIssuesModel = sinon.stub(IssueManager, "getIssuesModel", function () {
				return createMultipleIssues(9);
			});
			this.oGetRulesViewModel = sinon.stub(IssueManager, "getRulesViewModel", function (mRules, mSelectedRules, mIssues) {
				return {
					"sap.m": {
						breadcrumbsInOverflowToolbar: createValidRule(),
						selected: true,
						issueCount: 9
					}
				};
			});
			this.oGetRuleSets = sinon.stub(RuleSetLoader, "getRuleSets", function () {
				return {};
			});
			this.oContext = {
				_oDataCollector: {
					getAppInfo: function () {
						return [
							{
								applicationVersion: {version: "1.0.0"},
								id: "test",
								title: "mock",
								type: "application",
								registrationIds: ["F1234", "F5678"]
							},
							{
								applicationVersion: {version: "2.0.0"},
								id: "othertest",
								title: "second mock",
								type: "application",
								registrationIds: ["F8888"]
							}
						];
					},
					getTechInfoJSON: function () {
						return {title: "Mock"};
					}
				},
				_oExecutionScope: {
					_getType: function () {
						return "global";
					},
					_getContext: function () {
						return {type: "global"};
					}
				},
				_oAnalyzer: {
					getElapsedTimeString: function () {
						return "00:00:00:50";
					}
				},
				_oSelectedRulesIds: {},
				_oSelectedRulePreset: {
					id: "TestPreset",
					title: "Test Preset",
					description: "Description of test preset",
					dateExported: ""
				}
			};
		},
		afterEach: function () {
			this.oGetIssues.restore();
			this.oGetIssuesModel.restore();
			this.oGetRulesViewModel.restore();
			this.oGetRuleSets.restore();
			this.oContext = null;
			History.clearHistory();
		}
	});

	QUnit.test("History saveAnalysis", function (assert) {
		assert.strictEqual(History.getRuns().length, 0, "The initial state of the history runs is empty");
		// Act
		History.saveAnalysis(this.oContext);

		assert.strictEqual(History.getRuns().length, 1, "The analysis has been stored in the runs array");
		assert.strictEqual(History.getRuns()[0]["analysisDuration"], "00:00:00:50", "Check the value is correct");

		History.saveAnalysis(this.oContext);
		assert.strictEqual(History.getRuns().length, 2, "Check if after second analysis the object is stored");
	});

	QUnit.test("History clearHistory", function (assert) {
		History.saveAnalysis(this.oContext);
		History.saveAnalysis(this.oContext);

		assert.strictEqual(History.getRuns().length, 2, "Ensure that we have some stored data");
		// Act
		History.clearHistory();

		assert.strictEqual(History.getRuns().length, 0, "Ensure that everything was removed");
	});

	QUnit.test("History getHistory", function (assert) {
		// Act
		History.saveAnalysis(this.oContext);
		var aResults = History.getHistory(),
			aIssues = aResults[0]["loadedLibraries"]["sap.m"]["rules"]["breadcrumbsInOverflowToolbar"]["issues"],
			bIsGeneratedJsonMatchTheTemplate = compareJSON(oTemplateObject, aResults[0]);

		// Assert
		assert.strictEqual(bIsGeneratedJsonMatchTheTemplate, true, "The returned json matched the template.");

		assert.strictEqual(aIssues.length, 9, "The returned json matched the template.");
		aIssues.forEach(function (oIssue) {
			assert.strictEqual(compareJSON(oTemplateForIssue, oIssue), true, "The returned json matched the template.");
		});
		aIssues = null;
	});

	QUnit.test("History getFormattedHistory - ABAP format passed", function (assert) {
		// Act
		History.saveAnalysis(this.oContext);
		var oFormattedHistory = History.getFormattedHistory(sap.ui.support.HistoryFormats.Abap);

		// Assert
		// For ABAP parser the Collections should be arrays instead of dictionaries with key/value pairs.
		assert.ok(Array.isArray(oFormattedHistory), "History should be an array.");
		assert.ok(Array.isArray(oFormattedHistory[0].loadedLibraries), "Loaded libraries should be an array.");
		assert.ok(Array.isArray(oFormattedHistory[0].loadedLibraries[0].rules), "Rules should be an array.");
		assert.ok(Array.isArray(oFormattedHistory[0].loadedLibraries[0].rules[0].issues), "Issues should be an array.");

		assert.ok(oFormattedHistory[0].hasOwnProperty("rulePreset"), "Should have rule preset");
		assert.ok(oFormattedHistory[0].rulePreset.hasOwnProperty("id"), "Rule preset should have id");
		assert.ok(oFormattedHistory[0].rulePreset.hasOwnProperty("title"), "Rule preset should have title");
		assert.ok(oFormattedHistory[0].rulePreset.hasOwnProperty("description"), "Rule preset should have description");
		assert.ok(oFormattedHistory[0].rulePreset.hasOwnProperty("dateExported"), "Rule preset should have dateExported");

		assert.ok(Array.isArray(oFormattedHistory[0].registrationIds), "Registration ids should be an array.");
		assert.deepEqual(oFormattedHistory[0].registrationIds, ["F1234", "F5678", "F8888"], "Registration ids are correct.");
	});

	QUnit.test("History getFormattedHistory - String format passed", function (assert) {
		// Act
		History.saveAnalysis(this.oContext);
		var sFormattedHistory = prepareHistoryString(History.getFormattedHistory(sap.ui.support.HistoryFormats.String));

		// Assert
		assert.ok(sFormattedHistory === sReferenceFormattedHistory, "History should be a correctly formatted string.");
	});

	QUnit.test("History getFormattedHistory - NO format passed", function (assert) {
		// Act
		History.saveAnalysis(this.oContext);
		var sFormattedHistory = prepareHistoryString(History.getFormattedHistory());

		// Assert
		assert.ok(sFormattedHistory === sReferenceFormattedHistory, "History should be a correctly formatted string.");
	});
});