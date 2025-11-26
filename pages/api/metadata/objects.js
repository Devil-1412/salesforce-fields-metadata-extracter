export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { accessToken, instanceUrl } = req.body;

        if (!accessToken || !instanceUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing accessToken or instanceUrl'
            });
        }

        // Fetch all sobjects from Salesforce
        const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch objects from Salesforce');
        }

        const data = await response.json();

        // Extract object names and filter to queryable objects only
        const objects = data.sobjects
            .filter(obj => obj.queryable)
            .map(obj => ({
                name: obj.name,
                label: obj.label,
                labelPlural: obj.labelPlural
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({
            success: true,
            data: objects
        });

    } catch (error) {
        console.error('Error fetching objects:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch objects'
        });
    }
}
