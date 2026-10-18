#!/usr/bin/env python3
"""Probe the game research MCP endpoint. Never publish tokens or raw private payloads."""
import json, os, urllib.request, urllib.error
URL=os.environ.get("GAME_RESEARCH_MCP_URL","https://ai.xianjianwendao.com/kb/mcp/mcp")
token=os.environ.get("GAME_RESEARCH_MCP_TOKEN","")
headers={"Content-Type":"application/json","Accept":"application/json, text/event-stream"}
if token: headers["Authorization"]="Bearer "+token
def rpc(method, params, session=None):
    h=dict(headers)
    if session: h["Mcp-Session-Id"]=session
    payload=json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode()
    req=urllib.request.Request(URL,payload,h,method="POST")
    try:
        with urllib.request.urlopen(req,timeout=25) as res:
            body=res.read(250000).decode("utf-8","replace")
            session=res.headers.get("Mcp-Session-Id")
            if "text/event-stream" in res.headers.get("Content-Type",""):
                body="\n".join(x[6:] for x in body.splitlines() if x.startswith("data: "))
            return json.loads(body),session
    except urllib.error.HTTPError as e:
        print("HTTP",e.code,"at",method,"(authentication or endpoint setup may be required)")
        return None,None
    except Exception as e:
        print("Connection failed:",type(e).__name__)
        return None,None
init,session=rpc("initialize",{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"mobile-brief-probe","version":"0.1"}})
if not init:
    raise SystemExit(1)
print("MCP initialize:", "OK" if "result" in init else "Unexpected response")
tools,session2=rpc("tools/list",{},session)
if not tools or "result" not in tools:
    raise SystemExit(2)
items=tools["result"].get("tools",[])
print("Available tools:",len(items))
for t in items:
    print("-",t.get("name","unknown"),":",str(t.get("description",""))[:110].replace("\n"," "))
print("Diagnostic only: no tool calls, no data exported, no changes to live report.")
