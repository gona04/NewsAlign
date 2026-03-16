import { auth } from 'express-oauth2-jwt-bearer';

const domain = process.env._0_AUTH_FACT_CHECKING_APP_DOMAIN;
const audience = process.env._0_AUTH_FACT_CHECKING_APP_AUDIENCE;

export const checkJwt = auth({
  audience,
  issuerBaseURL: `https://${domain}`,
  tokenSigningAlg: 'RS256',
});