import { app } from '@azure/functions';
import './functions/ImportLinkedInToMixpanel';
import './functions/MixpanelProxy';

app.setup({
    enableHttpStream: true,
});