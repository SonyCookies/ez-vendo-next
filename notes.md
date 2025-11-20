TO DO'S:
    GENERAL:
        - Add Loading State for every page
        - Add History/Log page(?)

    BRANCHES:
        1. admin-topup:
            - refine UI/UX of pages
            - refine the navbar
            - set navbar into a component
                - created toggle notification
                - added static data for notification
                - implement path identifier for active button UI
            - created necessary pages (Dashboard, Top-up Management, List of Users, etc...)
            - created desktop navbar
                - created toggle notification
                - added static data for notification
                - implement path identifier for active label
        2. admin-topup-function
            - created 2 buttons
                - Top-up Requests
                - Manual Top-up
            - created and rendered Top-up Requests
                - added static data for pending requests
                - created pending request modal to see full details of the request
                - implemented a mini overview of the total pending request for present day
                - created table pending request for desktop device and change to cards for smaller device
                - created a delete confirmation modal for rejecting pending request
        3. admin-manual-topup-function
            - created top-up form
                - created a modal for searching user by name or RFID No.
                - implemented top-up form function wherein when the're a selected user, the top-up form will show
                - created a Top-up successful modal whenever the manual top-up is successful

            - created manual top-up transactins/logs
                - created a recent manual top-up transaction table for desktop and card button for mobile
                - created and implemented a selected transaction modal to review full transaction
        4. admin-transaction-page-function
            - include only the completed and rejected transactions
            - added Transaction Logs in Navbar
            - transactions page:
                - All Transactions
                    - added a mock data for Today, Yesterday, and Last & Days Transaction
                    - implemented a selected transaction modal
                - Completed Transactions
                    - added a mock data for Today, Yesterday, and Last & Days Transaction
                    - implemented a selected transaction modal
                - Rejected Transactions
                    - added a mock data for Today, Yesterday, and Last & Days Transaction
                    - implemented a selected transaction modal
            - implemented filter function for All, Completed, and Rejected Transaction



        
