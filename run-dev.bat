@echo off
cd /d "c:\Users\丁祥军\OneDrive - The University of Nottingham Ningbo China\knowledge-manager"
set EXECUTION_POLICY_BYPASS=powershell -ExecutionPolicy Bypass -Command "npm run dev"
call %EXECUTION_POLICY_BYPASS%