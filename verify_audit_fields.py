#!/usr/bin/env python3
"""
Database Field Verification Script - Run from VPS Backend Server

This script should be executed from the VPS (190.7.234.37) where the backend
has access to the MySQL database. It verifies audit-related fields in the
incidents table and provides data analysis.

Usage:
    python3 verify_audit_fields.py
"""

import sys

try:
    import pymysql
except ImportError:
    print("ERROR: pymysql not installed. Install with: pip3 install pymysql")
    sys.exit(1)

# Database connection parameters
DB_CONFIG = {
    'host': '190.7.234.37',
    'port': 3025,
    'user': 'ipnext',
    'password': 'ipnext',
    'database': 'ipnext'
}

def run_query(query, description):
    """Execute a query and print results"""
    print(f"\n{'=' * 80}")
    print(f"QUERY: {description}")
    print(f"{'=' * 80}")
    print(f"SQL: {query}\n")

    try:
        conn = pymysql.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            cursorclass=pymysql.cursors.DictCursor
        )

        with conn.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()

            if not results:
                print("No results returned.\n")
                return []

            # Print results in table format
            if len(results) > 0:
                # Print header
                headers = list(results[0].keys())
                col_widths = {h: max(len(str(h)), max(len(str(row[h])) for row in results))
                             for h in headers}

                header_line = " | ".join(f"{h:{col_widths[h]}}" for h in headers)
                print(header_line)
                print("-" * len(header_line))

                # Print rows
                for row in results:
                    print(" | ".join(f"{str(row[h]):{col_widths[h]}}" for h in headers))

                print(f"\nTotal rows: {len(results)}\n")

            return results

    except Exception as e:
        print(f"ERROR: {e}\n")
        return []
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    print("=" * 80)
    print("BETELGEUSE - AUDIT FIELDS VERIFICATION")
    print("Database: ipnext @ 190.7.234.37:3025")
    print("=" * 80)

    # 1. Verify table exists
    print("\n[1/7] Checking if incidents table exists...")
    query = "SHOW TABLES LIKE 'incidents';"
    results = run_query(query, "Check incidents table exists")

    if not results:
        print("ERROR: 'incidents' table not found!")
        print("Available tables with 'incident' or 'ticket' in name:")
        run_query("SHOW TABLES LIKE '%incident%';", "Tables matching 'incident'")
        run_query("SHOW TABLES LIKE '%ticket%';", "Tables matching 'ticket'")
        return

    print("✓ incidents table found")

    # 2. Show table structure
    print("\n[2/7] Getting table structure...")
    query = "DESCRIBE incidents;"
    run_query(query, "Table structure")

    # 3. Show audit-related fields specifically
    print("\n[3/7] Checking audit-related fields...")
    query = "SHOW COLUMNS FROM incidents LIKE 'audit%';"
    results = run_query(query, "Audit fields")

    if not results:
        print("WARNING: No fields starting with 'audit' found!")
        print("The audit functionality might use different field names.")
        print("Checking for common alternatives...")

        # Check for alternative field names
        alternatives = ['audited', 'is_audited', 'audit_count', 'audited_at', 'audit_status']
        for alt in alternatives:
            query = f"SHOW COLUMNS FROM incidents LIKE '{alt}';"
            run_query(query, f"Check for '{alt}' field")
    else:
        print(f"✓ Found {len(results)} audit-related fields")

    # 4. Show fields related to exceeded_threshold
    print("\n[4/7] Checking exceeded_threshold field...")
    query = "SHOW COLUMNS FROM incidents WHERE Field = 'exceeded_threshold';"
    run_query(query, "exceeded_threshold field details")

    # 5. Check current data distribution
    print("\n[5/7] Analyzing current data distribution...")
    query = """
    SELECT
        COUNT(*) as total_tickets,
        SUM(CASE WHEN is_closed = 1 THEN 1 ELSE 0 END) as closed_tickets,
        SUM(CASE WHEN is_closed = 0 THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN exceeded_threshold = 1 THEN 1 ELSE 0 END) as exceeded_tickets,
        SUM(CASE WHEN is_closed = 0 AND exceeded_threshold = 1 THEN 1 ELSE 0 END) as vencidos_current
    FROM incidents;
    """
    run_query(query, "Overall ticket distribution")

    # 6. Check audit field values distribution (if they exist)
    print("\n[6/7] Analyzing audit field values...")
    query = """
    SELECT
        audit_requested,
        audit_status,
        COUNT(*) as count
    FROM incidents
    WHERE is_closed = 0 AND exceeded_threshold = 1
    GROUP BY audit_requested, audit_status
    ORDER BY count DESC;
    """
    results = run_query(query, "Vencidos tickets by audit status")

    if not results:
        print("Note: Query failed. The audit fields might not exist or have different names.")
        print("Trying alternative query...")

        # Try without audit fields
        query = """
        SELECT
            COUNT(*) as vencidos_count
        FROM incidents
        WHERE is_closed = 0 AND exceeded_threshold = 1;
        """
        run_query(query, "Vencidos tickets (without audit filter)")

    # 7. Show sample tickets with audit information
    print("\n[7/7] Sample tickets with audit information...")
    query = """
    SELECT
        ticket_id,
        is_closed,
        exceeded_threshold,
        audit_requested,
        audit_status,
        audit_notified,
        audit_requested_at,
        created_at
    FROM incidents
    WHERE exceeded_threshold = 1 AND is_closed = 0
    ORDER BY created_at DESC
    LIMIT 10;
    """
    results = run_query(query, "Sample vencidos tickets with audit info")

    if not results:
        print("Note: Query failed. Trying simpler query without audit fields...")
        query = """
        SELECT
            ticket_id,
            is_closed,
            exceeded_threshold,
            created_at
        FROM incidents
        WHERE exceeded_threshold = 1 AND is_closed = 0
        ORDER BY created_at DESC
        LIMIT 10;
        """
        run_query(query, "Sample vencidos tickets (basic info)")

    # 8. Show indexes on incidents table
    print("\n[8/7] BONUS: Checking indexes on incidents table...")
    query = "SHOW INDEX FROM incidents;"
    results = run_query(query, "Table indexes")

    if results:
        # Highlight indexes related to our filter fields
        print("\nIndexes relevant to vencidos filtering:")
        for idx in results:
            col = idx['Column_name']
            if col in ['is_closed', 'exceeded_threshold', 'audit_requested', 'audit_status']:
                print(f"  ✓ {idx['Key_name']:30} on {col:30} (unique={idx['Non_unique']==0})")

    # Summary
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print("\nSummary:")
    print("1. Use the table structure above to confirm audit field names")
    print("2. Check the 'Vencidos tickets by audit status' section to see current data")
    print("3. If audit fields exist, update Metrics.jsx filter as documented")
    print("4. If audit fields don't exist, they need to be added to the backend")
    print("\nRecommended filter SQL (adjust field names as needed):")
    print("""
    SELECT * FROM incidents
    WHERE is_closed = 0
      AND exceeded_threshold = 1
      AND (audit_requested = 0 OR audit_requested IS NULL)
      AND audit_status IS NULL;
    """)
    print("\nDocumentation: .claude/agent-memory/database-query-optimizer/INCIDENT_AUDIT_FIELDS.md")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
