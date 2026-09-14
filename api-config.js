// Paste the Apps Script Web App URL here (ends in /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbxfLtQASbpULIDGoPGfQiJHf2WqlvnhquoEYPaSMwyUMvR15szQCfajmITUbFTL5nR0/exec";

// Helper: all requests use text/plain to avoid CORS preflight issues with Apps Script
async function apiCall(payload){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  return res.json();
}