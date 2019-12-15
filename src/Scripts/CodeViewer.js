/// <reference path="../../Components/google-code-prettify/prettify.js" />

/* global prettyPrint */
/* exported CodeViewer */

var CodeViewer = (function ()
{
	"use strict";

	let paneLoadStatus =
		{
			html: false,
			script: false,
			css: false
		};

	let fontSizes =
		{
			HTMLView: 12,
			ScriptView: 12,
			CSSView: 12
		};


	function getQueryParams()
	{
		let i, assignmentHalves, varName, valueString, paramArray,
			queryParams = {},
			queryText = window.location.search;

		if (queryText.length > 0)
			queryText = queryText.substr(1);

		paramArray = queryText.split("&");
		for (i = 0; i < paramArray.length; i++)
		{
			assignmentHalves = paramArray[i].split("=");
			varName = assignmentHalves[0];
			valueString = decodeURIComponent(assignmentHalves[1]);
			if (typeof queryParams[varName] === "undefined")
				queryParams[varName] = valueString;
			else if (typeof queryParams[varName] === "string")
				queryParams[varName] = [queryParams[varName], valueString];
			else
				queryParams[varName].push(valueString);
		}

		return queryParams;
	} // end getQueryParams()


	function setupPage()
	{
		const url = getQueryParams().url;
		let viewName;

		function onLargerClickHandlerCreator(preName)
		{ return function () { fontSizes[preName]++; document.getElementById(preName).style.fontSize = fontSizes[preName] + "px"; }; }

		function onSmallerClickHandlerCreator(preName)
		{ return function () { fontSizes[preName]--; document.getElementById(preName).style.fontSize = fontSizes[preName] + "px"; }; }

		for (viewName in fontSizes) if (Object.prototype.hasOwnProperty.call(fontSizes, viewName))
		{
			document.getElementById(viewName).style.fontSize = fontSizes[viewName] + "px";
			document.getElementById(viewName + "LargerFontButton").onclick = onLargerClickHandlerCreator(viewName);
			document.getElementById(viewName + "SmallerFontButton").onclick = onSmallerClickHandlerCreator(viewName);
		}

		sizeCodePanes();
		document.getElementById("PageViewFrame").src = url;
		loadCode(url, "HTMLView");

		window.onresize = sizeCodePanes;
	} // end setupPage()


	function loadCode(url, viewContainerName)
	{
		if (!window.XMLHttpRequest && "ActiveXObject" in window)
			window.XMLHttpRequest = function () { return new window.ActiveXObject("MSXML2.XMLHttp"); };

		let request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.onreadystatechange =
			(function(capturedURL, capturedRequest, capturedViewContainerName)
			{
				return function () { onLoadCodeStateChange(capturedURL, capturedRequest, capturedViewContainerName); };
			})(url, request, viewContainerName);
		request.send();
	} // end loadCode()


	function onLoadCodeStateChange(url, request, viewContainerName)
	{
		if (request.readyState !== 4)
			return;
		if (request.status !== 200 && request.status !== 304)
		{
			window.alert("error: " + request.status + ": " + request.statusText);
			return;
		}

		const responseText = request.responseText;
		let scriptURL,
			targetViewContainer = document.getElementById(viewContainerName);

		if (viewContainerName === "HTMLView")
		{
			const styleSheetExp = /<link\s+.*?(?:rel="stylesheet"\s+.*?href="([^"]+)")|(?:href="([^"]+)"\s+.*?rel="stylesheet").*?>/i,
				scriptExp = /<script\s+.*?(?:type="text\/javascript"\s+.*?src="([^"]+)")|(?:src="([^"]+)"\s+.*?type="text\/javascript").*?>/gi,
				requestAnimationFrameUrlExp = /(?:.*\/)*requestanimationframe\.(?:[^\n\r./]*\.)*js(?:#|\?|$)/i,
				concertUrlExp = /(?:.*\/)*concert\.(?:[^\n\r./]*\.)*js(?:#|\?|$)/i;
			
			let styleSheetExpResult = styleSheetExp.exec(responseText);
			if (styleSheetExpResult)
			{
				let styleSheetURL = styleSheetExpResult[1] ? styleSheetExpResult[1] : styleSheetExpResult[2];
				loadCode(styleSheetURL, "CSSView");
			}
			
			let scriptExpResult = scriptExp.exec(responseText),
				scriptSearchFinished = false;
			while (scriptExpResult && !scriptSearchFinished)
			{
				scriptURL = scriptExpResult[1] ? scriptExpResult[1] : scriptExpResult[2];
				if (requestAnimationFrameUrlExp.test(scriptURL)
					|| concertUrlExp.test(scriptURL))
				{
					scriptURL = null;
					scriptExpResult = scriptExp.exec(responseText);
				}
				else
					scriptSearchFinished = true;
			}
			if (scriptURL)
				loadCode(scriptURL, "ScriptView");
			else
			{
				document.getElementById("ScriptViewFileName").innerHTML = "(no javascript loaded)";
				document.getElementById("ScriptView").innerHTML = "";
				paneLoadStatus.script = true;
			}
		}

		targetViewContainer.innerHTML = document.createElement("pre").appendChild(document.createTextNode(responseText)).parentNode.innerHTML;

		let argLocation = url.indexOf("?"),
			displayUrl = (argLocation > -1 ? url.substring(0, argLocation) : url);
		if (viewContainerName === "HTMLView")
		{
			document.getElementById("HTMLViewFileName").innerHTML = displayUrl;
			paneLoadStatus.html = true;
		}
		else if (viewContainerName === "CSSView")
		{
			document.getElementById("CSSViewFileName").innerHTML = displayUrl;
			paneLoadStatus.css = true;
		}
		else if (viewContainerName === "ScriptView")
		{
			document.getElementById("ScriptViewFileName").innerHTML = displayUrl;
			paneLoadStatus.script = true;
		}

		if (paneLoadStatus.html && paneLoadStatus.css && paneLoadStatus.script)
			prettyPrint();
	} // end onLoadCodeStateChange()


	function sizeCodePanes()
	{
		let i, viewWindowElements = ["PageView", "CodeView1", "CodeView2", "CodeView3"],
			preElements = ["ScriptView", "HTMLView", "CSSView"],
			titleHeight = document.getElementById("PageTitle").offsetHeight,
			newPaneHeight = (typeof window.innerHeight === "undefined") ? 300 : ((window.innerHeight - titleHeight) / 2 - 4),
			viewSectionTopBarHeight = document.getElementById("ScriptViewTopBar").offsetHeight,
			preHeight = newPaneHeight - 2 - viewSectionTopBarHeight;

		for (i = 0; i < viewWindowElements.length; i++)
			document.getElementById(viewWindowElements[i]).style.height = newPaneHeight + "px";

		document.getElementById("PageViewFrame").style.height = newPaneHeight - 2 + "px";

		for(i = 0; i < preElements.length; i++)
			document.getElementById(preElements[i]).style.height = preHeight + "px";
	} // end sizeCodePanes()


	const publicInterface =
		{
			setupPage: setupPage
		};

	return publicInterface;
})(); // end CodeViewer singleton definition
