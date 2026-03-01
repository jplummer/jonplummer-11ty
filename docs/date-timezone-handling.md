# Date and Timezone Handling

Post dates use the formats described in [Authoring](authoring.md#required) (full ISO with offset or date-only). Date handling is load-bearing: `addDateParsing` and permalink generation preserve WordPress-era URLs. Do not change date logic or existing post URLs without verifying every permalink remains unchanged.
