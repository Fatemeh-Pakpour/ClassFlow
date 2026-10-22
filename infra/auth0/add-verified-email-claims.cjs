// Deploy as an Auth0 Post-Login Action and attach it to the Login flow.
// CLASSFLOW_API_AUDIENCE is an Action secret matching the API's AUTH0_AUDIENCE.
exports.onExecutePostLogin = async (event, api) => {
  const audience = event.secrets.CLASSFLOW_API_AUDIENCE;
  if (!audience || event.resource_server?.identifier !== audience) return;

  const namespace = 'https://classflow.app';
  if (typeof event.user.email === 'string') {
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
  }
  api.accessToken.setCustomClaim(
    `${namespace}/email_verified`,
    event.user.email_verified === true,
  );
};
