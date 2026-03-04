export interface PolicyRuleSet {
  allow: string[];
  deny: string[];
  ask: string[];
  fileDeny: string[];
}

const SHARED_FILE_DENY = [
  '.env',
  '**/.env*',
  '**/*secret*',
  '**/*credential*',
  '**/*.pem',
  '**/*id_rsa*',
];

const STRICT_DENY = [
  '*Remove-Item* -Recurse* -Force*',
  '*del * /s * /q *',
  '*rmdir* /s* /q*',
  '*format *',
  '*diskpart*',
  '*reg delete*',
  '*bcdedit*',
  '*cipher /w*',
  '*shutdown*',
  '*Stop-Computer*',
  '*Restart-Computer*',
  '*Start-Process* -Verb RunAs*',
  '*runas*',
  '*Invoke-WebRequest* | *iex*',
  '*curl* | *iex*',
  '*irm* | *iex*',
];

const BALANCED_DENY = [
  '*format *',
  '*diskpart*',
  '*reg delete*',
  '*bcdedit*',
  '*cipher /w*',
  '*Start-Process* -Verb RunAs*',
  '*runas*',
  '*Invoke-WebRequest* | *iex*',
  '*curl* | *iex*',
  '*irm* | *iex*',
];

const BALANCED_ASK = [
  '*Remove-Item* -Recurse* -Force*',
  '*del * /s * /q *',
  '*rmdir* /s* /q*',
  '*shutdown*',
  '*Restart-Computer*',
];

export function policyByMode(mode: 'strict' | 'balanced' | 'permissive'): PolicyRuleSet {
  if (mode === 'permissive') {
    return {
      allow: ['*'],
      deny: [],
      ask: [],
      fileDeny: SHARED_FILE_DENY,
    };
  }

  if (mode === 'balanced') {
    return {
      allow: [],
      deny: BALANCED_DENY,
      ask: BALANCED_ASK,
      fileDeny: SHARED_FILE_DENY,
    };
  }

  return {
    allow: [],
    deny: STRICT_DENY,
    ask: [],
    fileDeny: SHARED_FILE_DENY,
  };
}

