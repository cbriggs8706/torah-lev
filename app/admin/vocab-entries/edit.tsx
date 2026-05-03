import { Edit } from 'react-admin'
import { VocabEntryForm } from './form'

export const VocabEntryEdit = () => (
	<Edit>
		<VocabEntryForm includeEntryId />
	</Edit>
)
