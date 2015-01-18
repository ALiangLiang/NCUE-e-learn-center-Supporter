var xmlDoc = document.implementation.createDocument("", "", null);
var ndm, organization, resources, defaultOrgId = '';
var trackingActivityObj;
var first = true;
var myFrame, myPanel;
var isIE = (navigator.userAgent.indexOf('MSIE') > -1);

var lang                    = 'Big5';
var noavailable             = '無任何可使用之教材節點。';
var globalCurrentActivity   = '';
var globalSuspendedActivity = '';
var NextClusterId           = '';
var fetchNextCluster        = false;
var themePath               = '/theme/default/learn/';
var ser                     = '';
var slang                   = '';
var justPreview             = '';
var MSG_TO_THE              = '已達';
var MSG_OUTSET              = '頂端';
var MSG_END                 = '底端';
var MSG_FINISH              = '';

var ss = {"controlMode":{}, "sequencingRules":{}, "limitConditions":{}, "auxiliaryResources":{}, "rollupRules":{}, "objectives":{}, "randomizationControls":{}, "deliveryControls":{}};

function getSCORMVersion() {
	if (!xmlDoc) return;
	var manifest = xmlDoc.selectSingleNode('manifest');
	if (!manifest) return;
	var version = manifest.getAttribute('version');
	if (version) {
		return version;
	}
	else {
		var sn = xmlDoc.xml.indexOf('imsss:sequencing');
		return (sn > 0 ? '1.3' : '1.2');
	}
}


SCORM_VERSION = '1.2';

function xmlProcessor()
{
	window.status='';

	ndm = new NavigationDataModel();

	SCORM_VERSION = getSCORMVersion();

	xmlDoc.setProperty('SelectionLanguage', 'XPath');
	organization = xmlDoc.selectSingleNode('/manifest/organizations/organization[@identifier=../@default or position()=1]');

	if (organization == null){
		alert('organization not found.'); return;
	}

	resources = xmlDoc.selectSingleNode('/manifest/resources');

	myPanel = document.getElementById('displayPanel');
	rm_whitespace(myPanel);
	myPanel.innerHTML = isIE ? generateOrganizationByXsl(organization) : generateOrganization(organization);
	if (myPanel.getElementsByTagName('ul').length > 0) myPanel.getElementsByTagName('ul')[0].style.margin='0';
                   
	myFrame = parent.parent.document.getElementById('envClassRoom');
	parent.parent.document.getElementById('s_catalog').scrolling = 'no';
	if (myFrame.cols != '200,*')
		myFrame.cols = '200,*';


	//parent.adjustFrameHeight();
	if (globalCurrentActivity == '' || organization.selectSingleNode('//item[@identifier="' + globalCurrentActivity + '"]') == null){
		globalCurrentActivity = organization.selectSingleNode('//item[(not(@isvisible) or @isvisible!="false") and (not(@disabled) or @disabled!="true")]');
		if (globalCurrentActivity == null){
			parent.disable_control(false);
			var tmp = parent.parent.s_main.document.getElementsByTagName('H2');
			if (tmp && tmp.length > 0)
				tmp[0].innerHTML = '<BR />' + noavailable;
			return;
		}
		globalCurrentActivity = globalCurrentActivity.getAttribute('identifier');
	}
	parent.parent.globalState.CurrentActivity = globalCurrentActivity;
	launchActivity(null, globalCurrentActivity);
}

function doUnload()
{
	parent.parent.document.getElementById('s_catalog').scrolling = 'auto';
	myFrame = parent.parent.document.getElementById('envClassRoom');
	if (myFrame.cols != '0,*')
		myFrame.cols = '0,*';

	var objForm = document.getElementById('fetchResourceForm');

	if (objForm.href.value != 'about:blank')
	{
		objForm.href.value = 'about:blank';
		objForm.target = 'empty';
		objForm.submit();
	}
}


window.onbeforeunload = function(){
	var x ;
	try
	{
		if (typeof(x = parent.parent.s_main.document.body.onunload) == 'function')
		{
			x();
			parent.parent.s_main.document.body.onunload = null;
		}
	}
	catch(e)
	{
	}

	doUnload();
};

var expandingFlag = 'none';
function expandingAll(){
	var nodes = myPanel.getElementsByTagName('img');
	var icon = themePath + (expandingFlag ? 'icon-c.gif' : 'icon-cc.gif') ;
	for(var i=0; i<nodes.length; i++)
		if (nodes[i].parentNode.tagName.toLowerCase() == 'a' &&
			nodes[i].src.search(/icon-cc?\.gif$/) > -1)
		{
			nodes[i].parentNode.parentNode.parentNode.lastChild.style.display = expandingFlag;
			nodes[i].src = icon;
		}
	expandingFlag = expandingFlag ? '' : 'none';
}

function expanding(obj, mode){
	var ulObj = obj.parentNode.parentNode.lastChild;
	var m = (typeof(mode) == 'undefined') ? ulObj.style.display : mode;
	
	if (m == 'none'){
		ulObj.style.display = '' ;
		obj.firstChild.src = themePath + 'icon-cc.gif';
	}
	else{
		ulObj.style.display = 'none' ;
		obj.firstChild.src = themePath + 'icon-c.gif';
	}
	return false;
}

function chBgc(obj,mode){
	if (obj.style.backgroundColor == '#f0f0f0') return;
	obj.className = mode ? "cssTbFocus" : "cssTbBlur";
}

function getTitle(node){
	var title = node.selectSingleNode('./title');
	if (title != null && title.firstChild != null){
		var a = title.firstChild.nodeValue.split('\t');
		switch(lang){
			case 'GB2312'		: return (a[1]?a[1] : a[0]);
			case 'en'			: return (a[2]?a[2] : a[0]);
			case 'EUC-JP'		: return (a[3]?a[3] : a[0]);
			case 'user_define'	: return (a[4]?a[4] : a[0]);
			default: return a[0];
		}
	}
	else
		return '--=[ ' + node.getAttribute('identifier') + ' ]=--';
}

function stripTags(str)
{
	return str.replace(/<[^>]+>/g, '').replace(/<(\w+)( [^>]*)?>([^<]*)<\/\\1>/ig, '$3');
}


function htmlspecialchars_decode(str)
{
	return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}


function generateOrganizationByXsl(node)
{
	var xslDoc = XmlDocument.create();
	xslDoc.async = false;
	try {
		xslDoc.setProperty("AllowDocumentFunction", true);
		xslDoc.setProperty("ResolveExternals",true);
		xslDoc.setProperty("AllowXsltScript", true);
	}
	catch(e) {}
	xslDoc.load('manifest.xsl.php'+slang);
	return htmlspecialchars_decode(node.ownerDocument.transformNode(xslDoc));
}

function generateOrganization(node){
	var htmlCode = '', ret = '', idRef = '', nodeTitle = '', htmlTitle = '', nodeID = '', hasRef = false, isDisable = false, newTarget;
	var iref, res, href;
	if (node === null) return '';
	window.status += '|';

	var nodes = node.selectNodes('./item');

	for(var i=0; i<nodes.length; i++){
		if (nodes[i].getAttribute('isvisible') == 'false') continue;
		nodeTitle = getTitle(nodes[i]);
		htmlTitle = stripTags(nodeTitle);
		nodeID    = nodes[i].getAttribute('identifier');
		hasRef    = ((iref = nodes[i].getAttribute('identifierref')) &&
					 (res = resources.selectSingleNode('./resource[@identifier="' + iref + '"]')) &&
					 (href = res.getAttribute('href')) &&
					 (href != 'about:blank')) ? true : false;
		isDisable = nodes[i].getAttribute('disabled') == 'true' ? true : false;
		newTarget = nodes[i].getAttribute('target');
		/*** CUSTOM (b) ***/
		if (hasRef)
		{
			status = nodes[i].getAttribute('completion_status');
			icon = '<img border="0" width="16" height="16" align="absmiddle" src="' + themePath + 'sco/' + status + '.gif" alt="' + status + '" title="' + status + '">';
		}
		/*** CUSTOM (e) ***/
		if ((ret = generateOrganization(nodes[i])) == '') {
			htmlCode += '<li id="' + nodeID + '"><span class="cssTbBlur" onmouseover="chBgc(this,true);" onmouseout="chBgc(this,false);">' +
						'<img src="' + themePath + 'icon-ccc.gif" valign="absmiddle" border="0">&nbsp;' + icon; // CUSTOM
			if (hasRef && !isDisable)
				htmlCode += '<a href="javascript:;" onclick="return launchActivity(this,\'' + nodeID + '\',\'' + newTarget + '\');" class="link_fnt01" title="'+htmlTitle+'">' + nodeTitle + '</a>';
			else if (hasRef && isDisable)
				htmlCode += '<a href="javascript:;" onclick="return launchActivity(this,\'' + nodeID + '\',\'' + newTarget + '\');" disabled style="cursor:default" class="link_fnt01" title="'+htmlTitle+'">' + nodeTitle + '</a>';
			else
				htmlCode += nodeTitle;
			htmlCode += '</span>' + ret + '</li>';
		}
		else {
			htmlCode += '<li id="' + nodeID + '"><span class="cssTbBlur" onmouseover="chBgc(this,true);" onmouseout="chBgc(this,false);">' +
						'<a href="javascript:;" onclick="return expanding(this);">' +
						'<img src="' + themePath + 'icon-cc.gif" valign="absmiddle" border="0"></a>&nbsp;' + icon; // CUSTOM
			if (hasRef && !isDisable) {	
				htmlCode += '<a href="javascript:;" onclick="expanding(this);return launchActivity(this,\'' + nodeID + '\',\'' + newTarget + '\');" class="link_fnt01" title="' + nodeTitle + '">' + nodeTitle + '</a>'; // CUSTOM
			} else if (hasRef && isDisable) {
				htmlCode += '<a href="javascript:;" onclick="expanding(this);return launchActivity(this,\'' + nodeID + '\',\'' + newTarget + '\');" disabled style="cursor:default" class="link_fnt01" title="' + nodeTitle + '">' + nodeTitle + '</a>'; // CUSTOM
			} else
				htmlCode += nodeTitle;
			htmlCode += '</span>' + ret + '</li>';
		}
	}
	return (htmlCode ? ('<ul class="cssTbTd">' + htmlCode + '</ul>') : '');
}

function getMyXPath(node){
	if (node == null) return '';
	var curr = node;
	var xpath = '';
	while(curr != null){
		xpath = curr.tagName + '/' + xpath;
		curr = curr.parentNode;
	}
	return '/' + xpath;
}

function getLeadingSameXpath(xp1, xp2){
	var a1 = xp1.split('/');
	var a2 = xp2.split('/');
	var min_len = Math.min(a1.length, a2.length);
	for(var i = 0; i< min_len; i++){
		if (a1[i] != a2[i]){
			return '/' + a1.slice(0,i).join('/');
		}
	}
	return xp1 == xp2 ? xp1 : '';
}

function checkControlMode(node){
	if (globalCurrentActivity == ''){
	}
	else{
	}
}

var isLaunching = false;
function launchActivity(obj,id,target){
	if (isLaunching) return; else isLaunching = true;
	window.status = '';
	var item = xmlDoc.selectSingleNode('//item[@identifier="' + id + '"]');
	if (item == null ){
		alert('incorrect item id');
		isLaunching = false;
		return false;
	}

	if (item.getAttribute('disabled') == 'true')  {
		isLaunching = false;
		return false;
	}

	if (target == null) {
		target = item.getAttribute('target');
	}

	var parent_id = item.parentNode.getAttribute('identifier');
	
	var resource_id = item.getAttribute('identifierref');

	if (typeof(resource_id) == 'undefined') { isLaunching = false; return false; }
	var resource = resources.selectSingleNode('./resource[@identifier="' + resource_id + '"]');

	if (resource != null && id == globalCurrentActivity && obj != null)
	{
		if (resource.getAttribute('scormtype') != 'sco')
		{
			var base = resource.getAttribute('xml:base') == null ? ' ' : resource.getAttribute('xml:base');
			var href = base + '@' + resource.getAttribute('href');
			var rr = /\.(html?|swf)$/i;
			if (!rr.test(href))
			{
				objForm = document.getElementById('fetchResourceForm');
				objForm.href.value = href;
				objForm.target = (target == '_blank') ? '_blank' : 's_main';
				objForm.submit();
				//fetchServerTime();
			}
		}
		isLaunching = false;
		return false;
	}

	if (globalCurrentActivity != '' && obj != null){
		if (typeof(ss.sequencingRules[globalCurrentActivity]) != 'undefined' &&
		    typeof(ss.sequencingRules[globalCurrentActivity].postConditionRule) != 'undefined'
		   ){
			// alert(ss.sequencingRules[globalCurrentActivity].preConditionRule);
			var ret = determineSeqRule(ss.sequencingRules[globalCurrentActivity].postConditionRule, globalCurrentActivity);
			for(var i=0; i<ret.length; i++){
				switch(ret[i]){
					case 'exitParent':
					case 'exitAll':
					case 'retry':
					case 'retryAll':
					case 'continue':
					case 'previous':
				}
			}
		}
		if (typeof(ss.sequencingRules[parent_id]) != 'undefined' &&
		    typeof(ss.sequencingRules[parent_id].exitConditionRule) != 'undefined' &&
		    obj != null){
			ret = determineSeqRule(ss.sequencingRules[parent_id].exitConditionRule, parent_id);
			if (ret.length) ;
		}

		if (typeof(ss.sequencingRules[id]) != 'undefined' &&
			typeof(ss.sequencingRules[id].preConditionRule) != 'undefined') {
				ret = determineSeqRule(ss.sequencingRules[id].preConditionRule, id);
				for (var i = 0; i < ret.length; i++) {
					switch(ret[i]) {
						case 'skip': break;
						case 'disabled': break;
						case 'hiddenFromChoice': break;
						case 'stopForwardTraversal': break;
					}
				}
		}
	}

	if (id != globalCurrentActivity){
		var controlMode = (typeof(parent_id) == 'undefined' ? 'choice1' : ss.controlMode[parent_id]);
		if (typeof controlMode == 'undefined') controlMode = 'choice1';
		xmlDoc.setProperty('SelectionLanguage', 'XPath');
		var xpath = '';
		switch(controlMode){
			case 'forwardOnly':
				xpath = 'preceding::item[@identifierref][1]';
				break;
			case 'flow':
				xpath = 'preceding::item[@identifierref][1]|following::item[@identifierref][1]';
				break;
			case 'choice0':
				xpath = 'preceding::item[@identifierref]|following::item[@identifierref]';
				break;
			default:
				xpath = 'preceding::item[@identifierref]|following::item[@identifierref]';
				fetchNextCluster = true;
				break;
		}
		var nodes = item.selectNodes(xpath);
		var allow = false;
		for(var i=0; i<nodes.length; i++){
			if (nodes[i].getAttribute('identifier') == globalCurrentActivity) {allow = true; break;}
		}

		globalCurrentActivity = id;
		var NextCluster = item.selectSingleNode('ancestor::item/following::item/descendant-or-self::item[@identifierref]');
		NextClusterId = (NextCluster == null ? '' : NextCluster.getAttribute('identifier'));
		if (typeof(NextClusterId) == 'undefined') NextClusterId = '';

		nodes = item.selectNodes('./following::item');
		fetchNextCluster = (nodes.length) ? false : true;
		// xmlDoc.setProperty('SelectionLanguage', 'XSLPattern');
	}


	//parent.parent.globalState.PrevActivity = parent.parent.globalState.CurrentActivity;
	parent.parent.globalState.CurrentActivity = id;
	objForm = document.getElementById('fetchResourceForm');
	if (resource)
	base = resource.getAttribute('xml:base') == null ? ' ' : resource.getAttribute('xml:base');
	objForm.href.value = (resource == null) ? 'about:blank' : (base + '@' + resource.getAttribute('href'));
	objForm.target = (target == '_blank') ? '_blank' : 's_main';
	objForm.submit();
	//fetchServerTime();
	objForm.prev_node_id.value = id;
	objForm.prev_href.value = objForm.href.value;
	objForm.prev_node_title.value = getTitle(item).replace(/(<[^>]*>|^ | $)/g, '').replace(/^&nbsp;/, '');
	trackingActivityObj = new initTMD(item);
	trackingActivityObj['Activity Progress Information']['Activity Attempt Count']++;
	trackingActivityObj['Activity Status Information']['Activity is Active'] = true;

	var imgs = parent.document.getElementsByTagName('img');
	switch((typeof(ss.controlMode[parent_id]) == 'undefined' ? '' : ss.controlMode[parent_id])){
	case 'forwardOnly':
			imgs[2].src = 'icon/4-2.gif';
			imgs[7].src = 'icon/4-2.gif';
			break;
		default:
			break;
	}
	if (!fetchNextCluster)
	{
		imgs[3].src = 'icon/3-2.gif';
		imgs[6].src = 'icon/3-2.gif';
	}

	var nodes = myPanel.getElementsByTagName('span');
	for(var i=0; i<nodes.length; i++) 
	{
		nodes[i].style.backgroundColor = '';
		nodes[i].className = "cssTbBlur";
	}
	if (obj == null)
	{
		var x = document.getElementById(id);
		if (x != null && x.firstChild != null)
			x.firstChild.style.backgroundColor = '#f0f0f0';
	}
	else
	{
		if (obj.parentNode != null)
			obj.parentNode.style.backgroundColor = '#f0f0f0';
	}

	isLaunching = false;
	return false;
}

function determineSeqRule(obj, id){
	var ret = new Array();
	var condition = '';
	var operator = '';
	var result = 0;

	if (obj == null) return;
	for(var i=0; i<obj.length; i++){
		for(var j=0; j<obj[i].conditions.length; j++){
			if ((operator = obj[i].conditions[j].condition.charAt(0)) == '!'){
				condition = obj[i].conditions[j].condition.substr(1);
				operator = true;
			}
			else{
				condition = obj[i].conditions[j].condition;
				operator = false;
			}

			switch(condition){
				case 'satisfied':
					if (trackingActivityObj['Objective Progress Information']['Objective Progress Status'] &&
					    trackingActivityObj['Objective Progress Information']['Objective Satisfied Status']
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'objectiveStatusKnown':
					if (trackingActivityObj['Objective Progress Information']['Objective Progress Status'])
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'objectiveMeasureKnown':
					if (trackingActivityObj['Objective Progress Information']['Objective Progress Status'] &&
					    trackingActivityObj['Objective Progress Information']['Objective Measure Status']
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'objectiveMeasureGreaterThan':
					if (trackingActivityObj['Objective Progress Information']['Objective Measure Status'] &&
					    trackingActivityObj['Objective Progress Information']['Objective Normalized Measure'] >
						obj[i].conditions[j].measureThreshold
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'objectiveMeasureLessThan':
					if (trackingActivityObj['Objective Progress Information']['Objective Measure Status'] &&
					    trackingActivityObj['Objective Progress Information']['Objective Normalized Measure'] <
						obj[i].conditions[j].measureThreshold
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'completed':
					if (trackingActivityObj['Attempt Progress Information']['Attempt Progress Status'] &&
					    trackingActivityObj['Attempt Progress Information']['Attempt Completion Status']
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'activityProgressKnown':
					if (trackingActivityObj['Activity Progress Information']['Activity Progress Status'] &&
					    trackingActivityObj['Attempt Progress Information']['Attempt Progress Status']
				       )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'attempted':
					if (trackingActivityObj['Activity Progress Information']['Activity Progress Status'] &&
					    trackingActivityObj['Activity Progress Information']['Activity Attempt Count'] > 0
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'attemptLimitExceeded':
					if (trackingActivityObj['Activity Progress Information']['Activity Progress Status'] &&
					    typeof(ss.limitConditions[id].attemptLimit) == 'number' &&
					    trackingActivityObj['Activity Progress Information']['Activity Attempt Count'] >=
					    ss.limitConditions[id].attemptLimit
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'timeLimitExceeded':
					if (trackingActivityObj['Activity Progress Information']['Activity Progress Status'] &&
					    ( trackingActivityObj['Activity Progress Information']['Activity Absolute Duration'] >
					      ss.limitConditions[id].activityAbsoluteDurationLimit ||
					      trackingActivityObj['Activity Progress Information']['Activity Experienced Duration'] >
					      ss.limitConditions[id].activityExperiencedDurationLimit ||
					      trackingActivityObj['Attempt Progress Information']['Attempt Absolute Duration'] >
					      ss.limitConditions[id].attemptAbsoluteDurationLimit ||
					      trackingActivityObj['Attempt Progress Information']['Attempt Experienced Duration'] >
					      ss.limitConditions[id].attemptExperiencedDurationLimit
					    )
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
				case 'outsideAvailableTimeRange':
					var currentTime = new Date().getTime();
					if (currentTime < ss.limitConditions[id].beginTimeLimit ||
					    currentTime > ss.limitConditions[id].endTimeLimit
					   )
						result += 1;
					else if(operator)
						result += 1;
					break;
			}
		}
		if ( (obj[i].conditionCombination == 'all' && result == obj[i].conditions.length) ||
		     (obj[i].conditionCombination == 'any' && result > 0)
		   )
			ret[i] = obj[i].action;
		else
			ret[i] = '';
	}
	return ret;
}

function wiseParseSequencingGuy(sssNode){
	var item_id = sssNode.parentNode.getAttribute('identifier');
	var nodes = sssNode.childNodes;
	var PropertyValue = '', childs;

	for(var i=0; i<nodes.length; i++){
		if (nodes[i].nodeType != 1) continue;
		switch(nodes[i].tagName){
			case 'imsss:controlMode':
				if (nodes[i].getAttribute('forwardOnly') == 'true')
					ss.controlMode[item_id] = 'forwardOnly';
				else if (nodes[i].getAttribute('flow') == 'true')
					ss.controlMode[item_id] = 'flow';
				else if (nodes[i].getAttribute('choiceExit') != 'false')
					ss.controlMode[item_id] = 'choice1';
				else
					ss.controlMode[item_id] = 'choice0';

				break;

			case 'imsss:sequencingRules':
				parseSequencingRules(nodes[i], item_id);
				break;

			case 'imsss:limitConditions':
				if (nodes[i].attributes.length){
					ss.limitConditions[item_id] = new Object();
					if(typeof(PropertyValue = nodes[i].getAttribute('attemptLimit'))                     != 'undefined') ss.limitConditions[item_id].attemptLimit                     = parseInt(PropertyValue);
					if(typeof(PropertyValue = nodes[i].getAttribute('attemptAbsoluteDurationLimit'))     != 'undefined') ss.limitConditions[item_id].attemptAbsoluteDurationLimit     = PropertyValue;
					if(typeof(PropertyValue = nodes[i].getAttribute('attemptExperiencedDurationLimit'))  != 'undefined') ss.limitConditions[item_id].attemptExperiencedDurationLimit  = PropertyValue;
					if(typeof(PropertyValue = nodes[i].getAttribute('activityAbsoluteDurationLimit'))    != 'undefined') ss.limitConditions[item_id].activityAbsoluteDurationLimit    = PropertyValue;
					if(typeof(PropertyValue = nodes[i].getAttribute('activityExperiencedDurationLimit')) != 'undefined') ss.limitConditions[item_id].activityExperiencedDurationLimit = PropertyValue;
					if(typeof(PropertyValue = nodes[i].getAttribute('beginTimeLimit'))                   != 'undefined') ss.limitConditions[item_id].beginTimeLimit                   = PropertyValue;
					if(typeof(PropertyValue = nodes[i].getAttribute('endTimeLimit'))                     != 'undefined') ss.limitConditions[item_id].endTimeLimit                     = PropertyValue;
				}
				break;

			case 'imsss:auxiliaryResources':
				childs = nodes[i].childNodes;
				ss.auxiliaryResources[item_id] = '<ol>';
				for(var j=0; j<childs.length; j++){
					if (childs[j].tagName != 'imsss:auxiliaryResource') continue;
					ss.auxiliaryResources[item_id] += '<li><a href="' +
													  childs[j].getAttribute('auxiliaryResourceID') +
													  '" target="_blank">' +
													  childs[j].getAttribute('purpose') +
													  '</a></li>';
				}
				ss.auxiliaryResources[item_id] = '</ol>';
				break;

			case 'imsss:rollupRules':
				parseRollupRules(nodes[i], item_id);
				break;

			case 'imsss:objectives':
				parseObjectives(nodes[i], item_id);
				break;

			case 'imsss:randomizationControls':
				if (nodes[i].attributes.length){
					ss.deliveryControls[item_id] = new Object();
					if (typeof(PropertyValue = nodes[i].getAttribute('randomizationTiming')) != 'undefined') ss.deliveryControls[item_id].randomizationTiming = PropertyValue;
					if (typeof(PropertyValue = nodes[i].getAttribute('selectCount'))         != 'undefined') ss.deliveryControls[item_id].selectCount = PropertyValue;
					if (typeof(PropertyValue = nodes[i].getAttribute('reorderChildren'))     != 'undefined') ss.deliveryControls[item_id].reorderChildren = (PropertyValue == 'true' ? true : false) ;
					if (typeof(PropertyValue = nodes[i].getAttribute('selectionTiming'))     != 'undefined') ss.deliveryControls[item_id].selectionTiming = PropertyValue;
				}
				break;

			case 'imsss:deliveryControls':
				if (nodes[i].attributes.length){
					ss.limitConditions[item_id] = new Object();
					ss.limitConditions[item_id].tracked                = ((PropertyValue = nodes[i].getAttribute('tracked'))                == 'false') ? false : true;
					ss.limitConditions[item_id].completionSetByContent = ((PropertyValue = nodes[i].getAttribute('completionSetByContent')) == 'true')  ? true  : false;
					ss.limitConditions[item_id].objectiveSetByContent  = ((PropertyValue = nodes[i].getAttribute('objectiveSetByContent'))  == 'true')  ? true  : false;
				}
				break;
		}
	}
}

function parseSequencingRules(node, id){
	var condition, conditions, attribValue;
	var nodes = node.selectNodes('./imsss:preConditionRule');
	if (nodes.length){
		if (typeof(ss.sequencingRules[id]) == 'undefined') ss.sequencingRules[id] = new Object();
		ss.sequencingRules[id].preConditionRule = new Array();
		for(var i=0; i<nodes.length; i++){
    		condition = nodes[i].selectSingleNode('./imsss:ruleConditions');
    		conditions = condition.selectNodes('./imsss:ruleCondition');
    		ss.sequencingRules[id].preConditionRule[i] = new Object();
    		ss.sequencingRules[id].preConditionRule[i].conditions = new Array();
    		for(var j=0; j<conditions.length; j++){
    			ss.sequencingRules[id].preConditionRule[i].conditions[j] = new Object();
    			ss.sequencingRules[id].preConditionRule[i].conditions[j].condition = (
    			(conditions[j].getAttribute('operator') == 'not') ? '!' : '' ) +
    			conditions[j].getAttribute('condition');
    			if (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined')
    				ss.sequencingRules[id].preConditionRule[i].conditions[j].referencedObjective = attribValue;
    			ss.sequencingRules[id].preConditionRule[i].conditions[j].measureThreshold = (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined') ? attribValue : 0.000;
    		}
    		ss.sequencingRules[id].preConditionRule[i].combination = (condition.getAttribute('conditionCombination') == 'all' ? 'all' : 'any');
    		ss.sequencingRules[id].preConditionRule[i].action = nodes[i].selectSingleNode('./imsss:ruleAction').getAttribute('action');
		}
	}

	var nodes = node.selectNodes('./imsss:postConditionRule');
	if (nodes.length){
		if (typeof(ss.sequencingRules[id]) == 'undefined') ss.sequencingRules[id] = new Object();
		ss.sequencingRules[id].postConditionRule = new Array();
		for(var i=0; i<nodes.length; i++){
    		condition = nodes[i].selectSingleNode('./imsss:ruleConditions');
    		conditions = condition.selectNodes('./imsss:ruleCondition');
    		ss.sequencingRules[id].postConditionRule[i] = new Object();
    		ss.sequencingRules[id].postConditionRule[i].conditions = new Array();
    		for(var j=0; j<conditions.length; j++){
    			ss.sequencingRules[id].postConditionRule[i].conditions[j] = new Object();
    			ss.sequencingRules[id].postConditionRule[i].conditions[j].condition = (
    			(conditions[j].getAttribute('operator') == 'not') ? '!' : '' ) +
    			conditions[j].getAttribute('condition');
    			if (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined')
    				ss.sequencingRules[id].postConditionRule[i].conditions[j].referencedObjective = attribValue;
    			ss.sequencingRules[id].postConditionRule[i].conditions[j].measureThreshold = (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined') ? attribValue : 0.000;
    		}
    		ss.sequencingRules[id].postConditionRule[i].combination = (condition.getAttribute('conditionCombination') == 'all' ? 'all' : 'any');
    		ss.sequencingRules[id].postConditionRule[i].action = nodes[i].selectSingleNode('./imsss:ruleAction').getAttribute('action');
		}
	}

	var nodes = node.selectNodes('./imsss:exitConditionRule');
	if (nodes.length){
		if (typeof(ss.sequencingRules[id]) == 'undefined') ss.sequencingRules[id] = new Object();
		ss.sequencingRules[id].exitConditionRule = new Array();
		for(var i=0; i<nodes.length; i++){
    		condition = nodes[i].selectSingleNode('./imsss:ruleConditions');
    		conditions = condition.selectNodes('./imsss:ruleCondition');
    		ss.sequencingRules[id].exitConditionRule[i] = new Object();
    		ss.sequencingRules[id].exitConditionRule[i].conditions = new Array();
    		for(var j=0; j<conditions.length; j++){
    			ss.sequencingRules[id].exitConditionRule[i].conditions[j] = new Object();
    			ss.sequencingRules[id].exitConditionRule[i].conditions[j].condition = (
    			(conditions[j].getAttribute('operator') == 'not') ? '!' : '' ) +
    			conditions[j].getAttribute('condition');
    			if (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined')
    				ss.sequencingRules[id].exitConditionRule[i].conditions[j].referencedObjective = attribValue;
    			ss.sequencingRules[id].exitConditionRule[i].conditions[j].measureThreshold = (typeof(attribValue = conditions[j].getAttribute('referencedObjective')) != 'undefined') ? attribValue : 0.000;
    		}
    		ss.sequencingRules[id].exitConditionRule[i].combination = (condition.getAttribute('conditionCombination') == 'all' ? 'all' : 'any');
    		ss.sequencingRules[id].exitConditionRule[i].action = nodes[i].selectSingleNode('./imsss:ruleAction').getAttribute('action');
		}
	}
}

function parseRollupRules(node, id){
	ss.rollupRules[id] = new Object();
	ss.rollupRules[id].rollupObjectiveSatisfied = (node.getAttribute('rollupObjectiveSatisfied') == 'false' ? false : true);
	ss.rollupRules[id].rollupProgressCompletion = (node.getAttribute('rollupProgressCompletion') == 'false' ? false : true);
	ss.rollupRules[id].objectiveMeasureWeight   = (node.getAttribute('objectiveMeasureWeight')   == 'false' ? false : true);

	var childActivitySet;
	var nodes = node.selectNodes('./rollupRule');
	if (nodes.length){
		ss.rollupRules[id].rules = new Array();
		for(var i=0; i<nodes.length; i++){
			childActivitySet = nodes[i].getAttribute('childActivitySet');
			switch(childActivitySet){
				case 'any':
				case 'none':
					ss.rollupRules[id].rules[i].childActivitySet = childActivitySet;
					break;
				case 'atLeastCount':
					ss.rollupRules[id].rules[i].childActivitySet = 'atLeastCount';
					ss.rollupRules[id].rules[i].minimumCount = parseInt(nodes[i].getAttribute('minimumCount'));
					break;
				case 'atLeastPercent':
					ss.rollupRules[id].rules[i].childActivitySet = 'atLeastPercent';
					ss.rollupRules[id].rules[i].minimumPercent = parseFloat(nodes[i].getAttribute('minimumPercent'));
					break;
				default:
					ss.rollupRules[id].rules[i].childActivitySet = 'all';
					break;
			}
			condition = nodes[i].selectSingleNode('./imsss:rollupConditions');
    		conditions = condition.selectNodes('./imsss:rollupCondition');
    		ss.rollupRules[id].rules[i].conditions = new Array();
    		for(var j=0; j<conditions.length; j++){
    			ss.rollupRules[id].rules[i].conditions[j] = (
    			(conditions[j].getAttribute('operator') == 'not') ? '!' : '' ) +
    			conditions[j].getAttribute('condition');
    		}
    		ss.rollupRules[id].rules[i].combination = (condition.getAttribute('conditionCombination') == 'all' ? 'all' : 'any');
    		ss.rollupRules[id].rules[i].action = nodes[i].selectSingleNode('./imsss:rollupAction').getAttribute('action');
		}
	}
}

function parseObjectives(node, id){
	var attributeValue = '', nodes, nodess, targetID = '';
	var primaryObj = node.selectSingleNode('./imsss:primaryObjective');
	ss.objectives[id] = new Object();
	ss.objectives[id].primaryObjective = new Object();
	if (typeof(attributeValue = primaryObj.getAttribute('objectiveID')) == 'string') ss.objectives[id].primaryObjective.objectiveID = attributeValue;
	ss.objectives[id].primaryObjective.satisfiedByMeasure   = (primaryObj.getAttribute('satisfiedByMeasure') == 'true' ? true : false );
	ss.objectives[id].primaryObjective.minNormalizedMeasure = ((nodes = primaryObj.selectSingleNode('./imsss:minNormalizedMeasure')) == null ? 1.0000 : parseFloat(nodes.firstChild.nodeValue));
	nodes = primaryObj.selectNodes('./imsss:mapInfo');
	if(nodes.length){
		ss.objectives[id].primaryObjective.mapInfo = new Object();
		for(var i=0; i<nodes.length; i++){
			targetID = nodes[i].getAttribute('targetObjectiveID');
			ss.objectives[id].primaryObjective.mapInfo[targetID] = new Object();
			ss.objectives[id].primaryObjective.mapInfo[targetID].readSatisfiedStatus    = ((arrtibuteValue = nodes[i].getAttribute('readSatisfiedStatus'))    == 'false' ? false : true );
			ss.objectives[id].primaryObjective.mapInfo[targetID].readNormalizedMeasure  = ((arrtibuteValue = nodes[i].getAttribute('readNormalizedMeasure'))  == 'false' ? false : true );
			ss.objectives[id].primaryObjective.mapInfo[targetID].writeSatisfiedStatus   = ((arrtibuteValue = nodes[i].getAttribute('writeSatisfiedStatus'))   == 'true' ? true : false );
			ss.objectives[id].primaryObjective.mapInfo[targetID].writeNormalizedMeasure = ((arrtibuteValue = nodes[i].getAttribute('writeNormalizedMeasure')) == 'true' ? true : false );
		}
	}

	var nodes = node.selectNodes('./imsss:objective');
	if (nodes.length){
		ss.objectives[id].objectives = new Array();
		for(var j=0; j<nodes.length; j++){
			ss.objectives[id].objectives[j] = new Object();
			if (typeof(attributeValue = nodes[j].getAttribute('objectiveID')) == 'string') ss.objectives[id].objectives[j].objectiveID = attributeValue;
			ss.objectives[id].objectives[j].satisfiedByMeasure   = (nodes[j].getAttribute('satisfiedByMeasure') == 'true' ? true : false );
			ss.objectives[id].objectives[j].minNormalizedMeasure = ((nodess = nodes[j].selectSingleNode('./imsss:minNormalizedMeasure')) == null ? 1.0000 : parseFloat(nodess.firstChild.nodeValue));
			nodess = nodes[j].selectNodes('./imsss:mapInfo');
			if(nodess.length){
				ss.objectives[id].objectives[j].mapInfo = new Object();
				for(var i=0; i<nodess.length; i++){
					targetID = nodess[i].getAttribute('targetObjectiveID');
					ss.objectives[id].objectives[j].mapInfo[targetID] = new Object();
					ss.objectives[id].objectives[j].mapInfo[targetID].readSatisfiedStatus    = ((arrtibuteValue = nodess[i].getAttribute('readSatisfiedStatus'))    == 'false' ? false : true );
					ss.objectives[id].objectives[j].mapInfo[targetID].readNormalizedMeasure  = ((arrtibuteValue = nodess[i].getAttribute('readNormalizedMeasure'))  == 'false' ? false : true );
					ss.objectives[id].objectives[j].mapInfo[targetID].writeSatisfiedStatus   = ((arrtibuteValue = nodess[i].getAttribute('writeSatisfiedStatus'))   == 'true' ? true : false );
					ss.objectives[id].objectives[j].mapInfo[targetID].writeNormalizedMeasure = ((arrtibuteValue = nodess[i].getAttribute('writeNormalizedMeasure')) == 'true' ? true : false );
				}
			}
		}
	}
}

function initTMD(node){
	return (new TrackingModel(node));
}

function restoreTMD(obj, xmlNode){
	if (xmlNode == null) return;
	var nodes = xmlNode.childNodes;
	for(var i=0; i< nodes.length; i++){
		if (nodes[i].nodeType == 3)
			obj[nodes[i].tagName] = nodes[i].nodeValue;
		else if (nodes[i].nodeType != 1 || typeof(obj[nodes[i].tagName]) == 'undefined') continue;
		restoreTMD(obj[nodes[i].tagName], nodes[i]);
	}
}

function NavigationDataModel(){
	this['event']                          = '';
	this['control_mode_enabled']           = new Object();
	this['control_mode_enabled']['choice'] = true;
	this['control_mode_enabled']['flow']   = true;
	this['event_permitted']                = new Object();
	this['event_permitted']['continue']	   = null;
	this['event_permitted']['previous']	   = null;
}

function TrackingModel(node){
	this['Objective Progress Information'] = new Object();
	this['Objective Progress Information']['Objective Progress Status']    = false;
	this['Objective Progress Information']['Objective Satisfied Status']   = false;
	this['Objective Progress Information']['Objective Measure Status']     = false;
	this['Objective Progress Information']['Objective Normalized Measure'] = 0.0;

	this['Activity Progress Information'] = new Object();
	this['Activity Progress Information']['Activity Progress Status']      = false;
	this['Activity Progress Information']['Activity Absolute Duration']    = 0.0;
	this['Activity Progress Information']['Activity Experienced Duration'] = 0.0;
	this['Activity Progress Information']['Activity Attempt Count']        = 0;

	this['Attempt Progress Information'] = new Object();
	this['Attempt Progress Information']['Attempt Progress Status']      = false;
	this['Attempt Progress Information']['Attempt Completion Amount']    = 0.0;
	this['Attempt Progress Information']['Attempt Completion Status']    = false;
	this['Attempt Progress Information']['Attempt Absolute Duration']    = 0.0;
	this['Attempt Progress Information']['Attempt Experienced Duration'] = 0.0;

	this['Activity Status Information'] = new Object();
	this['Activity Status Information']['Activity is Active']    = false;
	this['Activity Status Information']['Activity is Suspended'] = false;

	var nodeList = new Array();
	if (node != null){
		var nodes = node.selectNodes('./item');
		for(var i=0; i< nodes.length; i++) nodeList[i] = nodes[i].getAttribute('identifier');
	}
	this['Activity Status Information']['Available Children'] = nodeList.join();
}

function help(){
	helpWin = window.open('about:blank', 'helpWin', 'width=400,height=300,left=10,top=10,toolbar=0,status=0,resizable=0,scrollbars=0,menubar=0');
	helpWin.title = 'HELP';
	helpWin.document.write('<h1 align=center><br>&#x4EE5;&#x4F60;~~~&#x7684;&#x667A;&#x6167;<br>&#x9084;&#x9700;&#x8981;&#x8F14;&#x52A9;&#x8AAA;&#x660E;&#x55CE;</h1>');
	helpWin.document.write('<p align=center><br><br><input type="button" value="&#x5C11;&#x552C;&#x54E2;&#x6211;" onclick="self.close();">&nbsp;&nbsp;<input type="button" value="&#x8AAA;&#x5F97;&#x4E5F;&#x662F;" onclick="self.close();"></p>');
}



function notebook() {
	window.open('/message/write_notebook.php');
}

window.onload = function() {
	console.log(parent.parent);
	parent.parent.globalState = {
		"CurrentActivity":'',
		"SuspendedActivity":'',
		"PrevActivity":''
	}/*
	parent.disable_control = function(val) {
		var toolbar1 = parent.document.getElementById('toolbar');
		var toolbar2 = parent.document.getElementById('toolbar1');
		toolbar1.rows[0].cells[0].firstChild.rows[0].cells[1].style.display = val ? '' : 'none';
		toolbar1.rows[0].cells[0].firstChild.rows[0].cells[2].style.display = val ? '' : 'none';
		toolbar1.rows[0].cells[0].firstChild.rows[0].cells[3].style.display = val ? '' : 'none';
		toolbar2.rows[0].cells[0].firstChild.rows[1].cells[0].style.display = val ? '' : 'none';
		toolbar2.rows[0].cells[0].firstChild.rows[2].cells[0].style.display = val ? '' : 'none';
	}*/
	xhr = new XMLHttpRequest();
	xhr.open("POST", "http://dlearn.ncue.edu.tw/learn/path/SCORM_loadCA.php");
	xhr.setRequestHeader("Content-Type", "application/xml");
	xhr.addEventListener("load", function() {console.log(xhr.responseXML);xmlDoc = xhr.responseXML;if(xmlDoc == undefined){console.log("failed");return;}xmlProcessor();}, false);
	xhr.send();
}