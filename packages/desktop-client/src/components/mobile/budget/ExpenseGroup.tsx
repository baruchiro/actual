import { useCallback, useMemo } from 'react';

import { Button } from '@actual-app/components/button';
import { Card } from '@actual-app/components/card';
import { SvgExpandArrow } from '@actual-app/components/icons/v0';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { type CSSProperties, styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';
import { AutoTextSize } from 'auto-text-size';

import { envelopeBudget, trackingBudget } from 'loot-core/client/queries';
import * as monthUtils from 'loot-core/shared/months';
import {
  type CategoryEntity,
  type CategoryGroupEntity,
} from 'loot-core/types/models';

import { useSyncedPref } from '../../../hooks/useSyncedPref';
import { PrivacyFilter } from '../../PrivacyFilter';
import { CellValue } from '../../spreadsheet/CellValue';
import { useFormat } from '../../spreadsheet/useFormat';

import { getColumnWidth } from './BudgetTable';
import { ExpenseCategoryList } from './ExpenseCategoryList';
import { ListItem } from './ListItem';

type ExpenseGroupProps = {
  group: CategoryGroupEntity;
  month: string;
  showHiddenCategories: boolean;
  onEditGroup: (id: CategoryGroupEntity['id']) => void;
  onEditCategory: (id: string) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  isCollapsed: (id: CategoryGroupEntity['id']) => boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
  showBudgetedColumn: boolean;
  show3Columns: boolean;
};

export function ExpenseGroup({
  group,
  onEditGroup,
  onEditCategory,
  month,
  onBudgetAction,
  showBudgetedColumn,
  show3Columns,
  showHiddenCategories,
  isCollapsed,
  onToggleCollapse,
}: ExpenseGroupProps) {
  const categories = useMemo(
    () =>
      isCollapsed(group.id)
        ? []
        : (group.categories?.filter(
            category => !category.hidden || showHiddenCategories,
          ) ?? []),
    [group.categories, group.id, isCollapsed, showHiddenCategories],
  );

  const shouldHideCategory = useCallback(
    (category: CategoryEntity) => {
      return !!(category.hidden || group.hidden);
    },
    [group.hidden],
  );

  return (
    <Card
      style={{
        marginTop: 4,
        marginBottom: 4,
      }}
    >
      <ExpenseGroupHeader
        group={group}
        month={month}
        showBudgetedColumn={showBudgetedColumn}
        show3Columns={show3Columns}
        onEdit={onEditGroup}
        isCollapsed={isCollapsed(group.id)}
        onToggleCollapse={onToggleCollapse}
      />

      <ExpenseCategoryList
        categories={categories}
        month={month}
        onEditCategory={onEditCategory}
        onBudgetAction={onBudgetAction}
        shouldHideCategory={shouldHideCategory}
        show3Columns={show3Columns}
        showBudgetedColumn={showBudgetedColumn}
      />
    </Card>
  );
}

type ExpenseGroupHeaderProps = {
  group: CategoryGroupEntity;
  month: string;
  onEdit: (id: CategoryGroupEntity['id']) => void;
  isCollapsed: boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
  show3Columns: boolean;
  showBudgetedColumn: boolean;
};

function ExpenseGroupHeader({
  group,
  month,
  onEdit,
  show3Columns,
  showBudgetedColumn,
  isCollapsed,
  onToggleCollapse,
}: ExpenseGroupHeaderProps) {
  return (
    <ListItem
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: !!group.hidden ? 0.5 : undefined,
        paddingLeft: 0,
        backgroundColor: monthUtils.isCurrentMonth(month)
          ? theme.budgetHeaderCurrentMonth
          : theme.budgetHeaderOtherMonth,
      }}
      data-testid="category-group-row"
    >
      <ExpenseGroupName
        group={group}
        onEdit={onEdit}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        show3Columns={show3Columns}
      />
      <ExpenseGroupCells
        group={group}
        show3Columns={show3Columns}
        showBudgetedColumn={showBudgetedColumn}
      />
    </ListItem>
  );
}

type ExpenseGroupNameProps = {
  group: CategoryGroupEntity;
  onEdit: (id: CategoryGroupEntity['id']) => void;
  isCollapsed: boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
  show3Columns: boolean;
};

function ExpenseGroupName({
  group,
  onEdit,
  isCollapsed,
  onToggleCollapse,
  show3Columns,
}: ExpenseGroupNameProps) {
  const sidebarColumnWidth = getColumnWidth({
    show3Columns,
    isSidebar: true,
    offset: -3.5,
  });
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        width: sidebarColumnWidth,
      }}
    >
      <Button
        variant="bare"
        className={css({
          flexShrink: 0,
          color: theme.pageTextSubdued,
          '&[data-pressed]': {
            backgroundColor: 'transparent',
          },
        })}
        onPress={() => onToggleCollapse(group.id)}
      >
        <SvgExpandArrow
          width={8}
          height={8}
          style={{
            flexShrink: 0,
            transition: 'transform .1s',
            transform: isCollapsed ? 'rotate(-90deg)' : '',
          }}
        />
      </Button>
      <Button
        variant="bare"
        style={{
          maxWidth: sidebarColumnWidth,
        }}
        onPress={() => onEdit(group.id)}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Text
            style={{
              ...styles.lineClamp(2),
              width: sidebarColumnWidth,
              textAlign: 'left',
              ...styles.smallText,
              fontWeight: '500',
            }}
            data-testid="category-group-name"
          >
            {group.name}
          </Text>
          <SvgCheveronRight
            style={{ flexShrink: 0, color: theme.tableTextSubdued }}
            width={14}
            height={14}
          />
        </View>
      </Button>
    </View>
  );
}

type ExpenseGroupCellsProps = {
  group: CategoryGroupEntity;
  show3Columns: boolean;
  showBudgetedColumn: boolean;
};

function ExpenseGroupCells({
  group,
  show3Columns,
  showBudgetedColumn,
}: ExpenseGroupCellsProps) {
  const [budgetType = 'rollover'] = useSyncedPref('budgetType');
  const format = useFormat();

  const columnWidth = getColumnWidth({ show3Columns });

  const amountStyle: CSSProperties = {
    width: columnWidth,
    fontSize: 12,
    fontWeight: '500',
    paddingLeft: 5,
    textAlign: 'right',
  };

  const budgeted =
    budgetType === 'report'
      ? trackingBudget.groupBudgeted(group.id)
      : envelopeBudget.groupBudgeted(group.id);

  const spent =
    budgetType === 'report'
      ? trackingBudget.groupSumAmount(group.id)
      : envelopeBudget.groupSumAmount(group.id);

  const balance =
    budgetType === 'report'
      ? trackingBudget.groupBalance(group.id)
      : envelopeBudget.groupBalance(group.id);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: 5,
      }}
    >
      <View
        style={{
          ...(!show3Columns && !showBudgetedColumn && { display: 'none' }),
        }}
      >
        <CellValue<'envelope-budget' | 'tracking-budget', 'group-budget'>
          binding={budgeted}
          type="financial"
        >
          {({ type, value }) => (
            <View>
              <PrivacyFilter>
                <AutoTextSize
                  key={value}
                  as={Text}
                  minFontSizePx={6}
                  maxFontSizePx={12}
                  mode="oneline"
                  style={amountStyle}
                >
                  {format(value, type)}
                </AutoTextSize>
              </PrivacyFilter>
            </View>
          )}
        </CellValue>
      </View>
      <View
        style={{
          ...(!show3Columns && showBudgetedColumn && { display: 'none' }),
        }}
      >
        <CellValue<'envelope-budget' | 'tracking-budget', 'group-sum-amount'>
          binding={spent}
          type="financial"
        >
          {({ type, value }) => (
            <View>
              <PrivacyFilter>
                <AutoTextSize
                  key={value}
                  as={Text}
                  minFontSizePx={6}
                  maxFontSizePx={12}
                  mode="oneline"
                  style={amountStyle}
                >
                  {format(value, type)}
                </AutoTextSize>
              </PrivacyFilter>
            </View>
          )}
        </CellValue>
      </View>
      <CellValue<'envelope-budget' | 'tracking-budget', 'group-leftover'>
        binding={balance}
        type="financial"
      >
        {({ type, value }) => (
          <View>
            <PrivacyFilter>
              <AutoTextSize
                key={value}
                as={Text}
                minFontSizePx={6}
                maxFontSizePx={12}
                mode="oneline"
                style={amountStyle}
              >
                {format(value, type)}
              </AutoTextSize>
            </PrivacyFilter>
          </View>
        )}
      </CellValue>
    </View>
  );
}
