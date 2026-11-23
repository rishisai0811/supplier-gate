# Evidence and product decision

Research checked 23 November 2026. This document separates observed requests from hypotheses. It does not claim customers or willingness to pay.

## Workflow evidence

- [Small-business supplier update discussion, 27 October 2026](https://www.reddit.com/r/smallbusiness/comments/1xh371u/the_annoying_part_of_running_a_small_business_is/): the post describes checking supplier updates for unintended product-detail, SKU and variant changes. Replies describe comparing against the previous file by SKU, keeping price/stock updates separate from descriptions and checking additions/removals. This is a useful workflow example, but a discussion is not a buyer commitment, and author independence has not been authenticated.
- [BigCommerce bulk-update discussion, 28 October 2026](https://www.reddit.com/r/bigcommerce/comments/1xi3len/title_bigcommerce_store_owners_how_do_you_manage/): comments discuss keeping an export, reviewing a diff and testing a small slice before a larger import. Other replies already use scripts or APIs. The broad question could be research or promotion; it should not be counted as clean purchase intent.
- [CSV matching question, 26 February 2025](https://www.reddit.com/r/excel/comments/1iyz24v/compare_2_csv_files/): asks for key-based comparison when row sets differ. This is historical context only, too old for current demand validation. Replies identify Power Query and a direct competing tool.
- [Broken CSV discussion, 26 October 2026](https://www.reddit.com/r/ETL/comments/1xfscqe/how_to_recover_broken_csv_files_values_that_have/): highlights the risk of guessed repairs. The author is already building a CSV editor, so it is not evidence of a buyer for another editor. It informed the decision to reject malformed input rather than guess.

## Existing tools, not a claimed empty market

Vendor pages inspected on the research date:

- [CSV Diff](https://www.csvdiff.org): browser-local keyed and composite-key comparison, exports, multiple delimiters and encodings. Strong overlap; a generic diff tool is not a gap.
- [NanoCell](https://nanocell-csv.com/): verbatim text editing, offline PWA, large-file previews and validators. A general CSV editor is not a gap.
- [CSV Workbench](https://csvworkbench.com/): browser-local schema validation, editor and SQL workflow. Strong overlap with generic validation.
- [JIMUHAKO CSV Preflight](https://jimuhako.itch.io/jimuhako-csv-preflight): downloadable offline validator, saved rules and standalone reports. Strong overlap with privacy and portability claims.

Supplier Gate's proposed distinction is a small **expected-field-change policy** layered over exact keyed comparison, with added/removed keys always escalated. This is a product hypothesis, not evidence that these competitors cannot support the same workflow. No superiority claim is made.

## Decision and validation gap

Build a bounded, no-server engineering product to test the workflow, not a large catalog platform. No live store writes, automatic data repair, new subscription or account integration. Cost to operate is zero because users open a local HTML file.

Fresh independent November requests and actual adoption are still missing. Before marketing, seek specific feedback on whether a protected-field policy and saved report improve on existing diff tools. Do not imply a community member requested or endorsed this product. Outreach requires reviewed wording and compliance with each community's rules.

## Distribution and income research

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) prohibit using Pages as free hosting for an online business, ecommerce site or commercial SaaS. A commercial hosting assumption should not be built around Pages.
- [Ko-fi payments](https://help.ko-fi.com/hc/en-us/articles/115003980093-How-do-I-get-paid) route funds to connected PayPal/Stripe accounts. This is not evidence the owner has an eligible account.
- [PayPal India receiving requirements](https://www.paypal.com/in/cshelp/article/how-do-i-receive-payments-through-paypal-help667) require identity confirmation and relevant receiving details, including PAN, an Indian bank account, purpose code and business description for international receiving.
- [PayPal purpose-code guidance](https://www.paypal.com/in/cshelp/article/what-is-the-purpose-code-and-how-is-it-different-from-the-nature-of-my-business-help978) warns that classification must match the real transaction. Do not relabel software sales as charitable donations or guess the code.

No payment account, tip page, charge, donation collection or payout connection was created. Any future collection needs confirmed account ownership, accurate description, appropriate payment classification and approval for the displayed identity and terms. Revenue is not guaranteed.
