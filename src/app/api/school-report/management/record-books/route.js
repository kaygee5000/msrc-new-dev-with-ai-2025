// src/app/api/school-report/management/record-books/route.js
import { NextResponse } from 'next/server';
import db from '@/utils/db'; // Relative path from record-books/route.js to src/utils/db.js

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const filters = {
        term: searchParams.get('term'),
        year: searchParams.get('year'),
        school_id: searchParams.get('school_id'),
        region_id: searchParams.get('region_id'),
        district_id: searchParams.get('district_id'),
        circuit_id: searchParams.get('circuit_id'),
    };

    const tableName = 'school_record_books';
    let query = `SELECT T.* FROM ${tableName} T`;
    const queryParams = [];
    let conditions = [];

    // Direct filters on the target table
    if (filters.term) {
        conditions.push('T.term = ?');
        queryParams.push(filters.term);
    }
    if (filters.year) {
        conditions.push('T.year = ?');
        queryParams.push(filters.year);
    }
    if (filters.school_id) {
        conditions.push('T.school_id = ?');
        queryParams.push(filters.school_id);
    }

    // Hierarchical filters (region, district, circuit) - apply if school_id is not directly provided
    if (!filters.school_id && (filters.region_id || filters.district_id || filters.circuit_id)) {
        let schoolSubQueryParts = {
            select: 'SELECT s.id FROM schools s',
            joins: [],
            conditions: [],
            params: []
        };

        if (filters.circuit_id) {
            schoolSubQueryParts.conditions.push('s.circuit_id = ?');
            schoolSubQueryParts.params.push(filters.circuit_id);
        }
        
        if (filters.district_id) {
            if (!schoolSubQueryParts.joins.includes('JOIN circuits c ON s.circuit_id = c.id')) {
                 schoolSubQueryParts.joins.push('JOIN circuits c ON s.circuit_id = c.id');
            }
            schoolSubQueryParts.conditions.push('c.district_id = ?');
            schoolSubQueryParts.params.push(filters.district_id);
        }
        
        if (filters.region_id) {
            if (!schoolSubQueryParts.joins.includes('JOIN circuits c ON s.circuit_id = c.id')) {
                 schoolSubQueryParts.joins.push('JOIN circuits c ON s.circuit_id = c.id');
            }
            if (!schoolSubQueryParts.joins.includes('JOIN districts d ON c.district_id = d.id')) {
                 schoolSubQueryParts.joins.push('JOIN districts d ON c.district_id = d.id');
            }
            schoolSubQueryParts.conditions.push('d.region_id = ?');
            schoolSubQueryParts.params.push(filters.region_id);
        }

        if (schoolSubQueryParts.params.length > 0 && schoolSubQueryParts.conditions.length > 0) {
            const schoolSubQuery = `
                ${schoolSubQueryParts.select}
                ${schoolSubQueryParts.joins.join(' ')}
                WHERE ${schoolSubQueryParts.conditions.join(' AND ')}
            `;
            conditions.push(`T.school_id IN (${schoolSubQuery})`);
            queryParams.push(...schoolSubQueryParts.params);
        }
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    try {
        const [results] = await db.query(query, queryParams);
        return NextResponse.json(results);
    } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submission_id');
    const tableName = 'school_record_books';

    if (!submissionId) {
        return NextResponse.json({ message: 'Submission ID is required' }, { status: 400 });
    }

    try {
        const [result] = await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [submissionId]);
        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Record not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error(`Error deleting from ${tableName} (ID: ${submissionId}):`, error);
        return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
    }
}
