import { Create } from 'react-admin'
import { VocabEntryForm } from './form'

export const VocabEntryCreate = () => (
	<Create>
		<VocabEntryForm includeEntryId={false} />
	</Create>
)
